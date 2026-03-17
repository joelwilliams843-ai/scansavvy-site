import requests
import sys
import json
from datetime import datetime

class ScanSavvyAPITester:
    def __init__(self, base_url="https://savvy-preview.preview.emergentagent.com"):
        self.base_url = base_url
        self.api_url = f"{base_url}/api"
        self.tests_run = 0
        self.tests_passed = 0
        self.test_user_id = None
        self.test_email = f"test_{datetime.now().strftime('%H%M%S')}@scansavvy.com"

    def run_test(self, name, method, endpoint, expected_status, data=None, params=None):
        """Run a single API test"""
        url = f"{self.api_url}/{endpoint}"
        headers = {'Content-Type': 'application/json'}

        self.tests_run += 1
        print(f"\n🔍 Testing {name}...")
        print(f"   URL: {url}")
        
        try:
            if method == 'GET':
                response = requests.get(url, headers=headers, params=params)
            elif method == 'POST':
                response = requests.post(url, json=data, headers=headers)
            elif method == 'PUT':
                response = requests.put(url, json=data, headers=headers)

            success = response.status_code == expected_status
            if success:
                self.tests_passed += 1
                print(f"✅ Passed - Status: {response.status_code}")
                try:
                    response_data = response.json()
                    if isinstance(response_data, dict) and len(response_data) <= 3:
                        print(f"   Response: {response_data}")
                    elif isinstance(response_data, dict):
                        print(f"   Response keys: {list(response_data.keys())}")
                    return True, response_data
                except:
                    return True, {}
            else:
                print(f"❌ Failed - Expected {expected_status}, got {response.status_code}")
                try:
                    error_data = response.json()
                    print(f"   Error: {error_data}")
                except:
                    print(f"   Error: {response.text}")
                return False, {}

        except Exception as e:
            print(f"❌ Failed - Error: {str(e)}")
            return False, {}

    def test_api_root(self):
        """Test API root endpoint"""
        return self.run_test("API Root", "GET", "", 200)

    def test_get_stores(self):
        """Test getting all stores"""
        success, response = self.run_test("Get All Stores", "GET", "stores", 200)
        if success and 'stores' in response:
            stores = response['stores']
            print(f"   Found {len(stores)} stores")
            if len(stores) >= 20:
                print(f"✅ Store count requirement met (20+)")
            else:
                print(f"⚠️  Only {len(stores)} stores found, expected 20+")
            
            # Check for key stores
            store_names = [s['name'] for s in stores]
            key_stores = ['Walmart', 'Target', 'Kroger', 'CVS']
            found_key_stores = [s for s in key_stores if s in store_names]
            print(f"   Key stores found: {found_key_stores}")
        return success, response

    def test_search_stores(self):
        """Test store search functionality"""
        return self.run_test("Search Stores", "GET", "stores", 200, params={"search": "walmart"})

    def test_store_categories(self):
        """Test getting store categories"""
        return self.run_test("Get Store Categories", "GET", "stores/categories", 200)

    def test_create_user(self):
        """Test creating a new user"""
        user_data = {
            "name": "Test User",
            "email": self.test_email
        }
        success, response = self.run_test("Create User", "POST", "users", 200, data=user_data)
        if success and 'id' in response:
            self.test_user_id = response['id']
            print(f"   Created user with ID: {self.test_user_id}")
        return success, response

    def test_get_user(self):
        """Test getting user by ID"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        return self.run_test("Get User by ID", "GET", f"users/{self.test_user_id}", 200)

    def test_get_user_by_email(self):
        """Test getting user by email"""
        return self.run_test("Get User by Email", "GET", f"users/email/{self.test_email}", 200)

    def test_update_user_stores(self):
        """Test updating user's selected stores"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        
        store_data = {
            "store_ids": ["walmart", "target", "kroger"]
        }
        return self.run_test("Update User Stores", "PUT", f"users/{self.test_user_id}/stores", 200, data=store_data)

    def test_toggle_manufacturer_coupons(self):
        """Test toggling manufacturer coupons"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        
        toggle_data = {"enabled": True}
        return self.run_test("Enable Manufacturer Coupons", "PUT", f"users/{self.test_user_id}/manufacturer-coupons", 200, data=toggle_data)

    def test_update_notification_method(self):
        """Test updating notification method"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        
        notification_data = {"method": "sms"}
        return self.run_test("Update Notification Method", "PUT", f"users/{self.test_user_id}/notification-method", 200, data=notification_data)

    def test_get_coupon_bundles(self):
        """Test getting coupon bundles for user"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        
        success, response = self.run_test("Get Coupon Bundles", "GET", f"users/{self.test_user_id}/coupon-bundles", 200)
        if success:
            print(f"   Store bundles: {len(response.get('store_bundles', []))}")
            print(f"   Manufacturer bundle: {'Yes' if response.get('manufacturer_bundle') else 'No'}")
            print(f"   Week of: {response.get('week_of', 'N/A')}")
        return success, response

    def test_get_qr_code(self):
        """Test getting QR code for a bundle"""
        if not self.test_user_id:
            print("❌ No test user ID available")
            return False, {}
        
        # Test manufacturer QR code
        bundle_id = f"bundle-manufacturer-{datetime.now().strftime('%Y%W')}"
        return self.run_test("Get QR Code", "GET", f"users/{self.test_user_id}/qr/{bundle_id}", 200)

    def test_invalid_endpoints(self):
        """Test error handling for invalid endpoints"""
        print("\n🔍 Testing Error Handling...")
        
        # Test non-existent user
        success, _ = self.run_test("Get Non-existent User", "GET", "users/invalid-id", 404)
        
        # Test invalid notification method
        if self.test_user_id:
            invalid_data = {"method": "invalid"}
            success2, _ = self.run_test("Invalid Notification Method", "PUT", f"users/{self.test_user_id}/notification-method", 400, data=invalid_data)
            return success and success2
        return success

def main():
    print("🚀 Starting ScanSavvy API Tests")
    print("=" * 50)
    
    tester = ScanSavvyAPITester()
    
    # Test sequence
    test_methods = [
        tester.test_api_root,
        tester.test_get_stores,
        tester.test_search_stores,
        tester.test_store_categories,
        tester.test_create_user,
        tester.test_get_user,
        tester.test_get_user_by_email,
        tester.test_update_user_stores,
        tester.test_toggle_manufacturer_coupons,
        tester.test_update_notification_method,
        tester.test_get_coupon_bundles,
        tester.test_get_qr_code,
        tester.test_invalid_endpoints
    ]
    
    for test_method in test_methods:
        try:
            test_method()
        except Exception as e:
            print(f"❌ Test failed with exception: {str(e)}")
    
    # Print results
    print("\n" + "=" * 50)
    print(f"📊 Test Results: {tester.tests_passed}/{tester.tests_run} passed")
    
    if tester.tests_passed == tester.tests_run:
        print("🎉 All tests passed!")
        return 0
    else:
        print(f"⚠️  {tester.tests_run - tester.tests_passed} tests failed")
        return 1

if __name__ == "__main__":
    sys.exit(main())