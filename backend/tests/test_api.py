"""
Backend API Tests for ScanSavvy
Tests all API endpoints for the weekly savings coupon app
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://weekly-savings-1.preview.emergentagent.com')

class TestHealthAndRoot:
    """Test basic API health and root endpoint"""
    
    def test_api_root(self):
        """Test API root endpoint returns expected message"""
        response = requests.get(f"{BASE_URL}/api/")
        assert response.status_code == 200
        data = response.json()
        assert "message" in data
        assert data["message"] == "ScanSavvy API"


class TestStoresAPI:
    """Test store-related endpoints"""
    
    def test_get_all_stores(self):
        """Test getting all stores"""
        response = requests.get(f"{BASE_URL}/api/stores")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert len(data["stores"]) > 0
        # Verify store structure
        store = data["stores"][0]
        assert "id" in store
        assert "name" in store
        assert "logo" in store
        assert "category" in store
    
    def test_search_stores(self):
        """Test store search functionality"""
        response = requests.get(f"{BASE_URL}/api/stores?search=walmart")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        # Should find Walmart
        store_names = [s["name"].lower() for s in data["stores"]]
        assert any("walmart" in name for name in store_names)
    
    def test_filter_stores_by_category(self):
        """Test filtering stores by category"""
        response = requests.get(f"{BASE_URL}/api/stores?category=Grocery")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        # All stores should be in Grocery category
        for store in data["stores"]:
            assert store["category"].lower() == "grocery"
    
    def test_get_store_categories(self):
        """Test getting unique store categories"""
        response = requests.get(f"{BASE_URL}/api/stores/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        assert len(data["categories"]) > 0
        # Should include common categories
        categories = [c.lower() for c in data["categories"]]
        assert "grocery" in categories


class TestUsersAPI:
    """Test user-related endpoints"""
    
    @pytest.fixture
    def test_user_data(self):
        """Test user data for creation"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        return {
            "email": f"TEST_user_{unique_id}@test.com",
            "name": f"TEST User {unique_id}"
        }
    
    def test_create_user(self, test_user_data):
        """Test creating a new user"""
        response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        assert response.status_code == 200
        data = response.json()
        
        # Verify user data
        assert "id" in data
        assert data["email"] == test_user_data["email"]
        assert data["name"] == test_user_data["name"]
        assert "selected_stores" in data
        assert "manufacturer_coupons_enabled" in data
        assert "notification_method" in data
        assert "created_at" in data
        
        # Default values
        assert data["selected_stores"] == []
        assert data["manufacturer_coupons_enabled"] == False
        assert data["notification_method"] == "push"
    
    def test_create_duplicate_user_returns_existing(self, test_user_data):
        """Test creating duplicate user returns existing user"""
        # Create first user
        response1 = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        assert response1.status_code == 200
        user1 = response1.json()
        
        # Try to create same user again
        response2 = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        assert response2.status_code == 200
        user2 = response2.json()
        
        # Should return same user
        assert user1["id"] == user2["id"]
    
    def test_get_user_by_id(self, test_user_data):
        """Test getting user by ID"""
        # Create user first
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        # Get user by ID
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == test_user_data["email"]
    
    def test_get_user_by_email(self, test_user_data):
        """Test getting user by email"""
        # Create user first
        requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        
        # Get user by email
        response = requests.get(f"{BASE_URL}/api/users/email/{test_user_data['email']}")
        assert response.status_code == 200
        data = response.json()
        assert data["email"] == test_user_data["email"]
    
    def test_get_nonexistent_user_returns_404(self):
        """Test getting non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/nonexistent-id-12345")
        assert response.status_code == 404
    
    def test_update_user_stores(self, test_user_data):
        """Test updating user's selected stores"""
        # Create user
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        # Update stores
        store_ids = ["walmart", "target", "kroger"]
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}/stores",
            json={"store_ids": store_ids}
        )
        assert response.status_code == 200
        data = response.json()
        assert data["selected_stores"] == store_ids
        
        # Verify persistence with GET
        get_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert get_response.json()["selected_stores"] == store_ids
    
    def test_toggle_manufacturer_coupons(self, test_user_data):
        """Test toggling manufacturer coupons"""
        # Create user
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        # Enable manufacturer coupons
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}/manufacturer-coupons",
            json={"enabled": True}
        )
        assert response.status_code == 200
        assert response.json()["manufacturer_coupons_enabled"] == True
        
        # Verify persistence
        get_response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert get_response.json()["manufacturer_coupons_enabled"] == True
        
        # Disable manufacturer coupons
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}/manufacturer-coupons",
            json={"enabled": False}
        )
        assert response.status_code == 200
        assert response.json()["manufacturer_coupons_enabled"] == False
    
    def test_update_notification_method(self, test_user_data):
        """Test updating notification method"""
        # Create user
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        # Test all valid methods
        for method in ["sms", "email", "push"]:
            response = requests.put(
                f"{BASE_URL}/api/users/{user_id}/notification-method",
                json={"method": method}
            )
            assert response.status_code == 200
            assert response.json()["notification_method"] == method
    
    def test_invalid_notification_method_returns_400(self, test_user_data):
        """Test invalid notification method returns 400"""
        # Create user
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        # Try invalid method
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}/notification-method",
            json={"method": "invalid"}
        )
        assert response.status_code == 400


class TestCouponBundlesAPI:
    """Test coupon bundle endpoints"""
    
    @pytest.fixture
    def user_with_stores(self):
        """Create a user with selected stores"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"TEST_bundle_{unique_id}@test.com",
            "name": f"TEST Bundle User {unique_id}"
        }
        
        # Create user
        create_response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        user = create_response.json()
        
        # Add stores
        requests.put(
            f"{BASE_URL}/api/users/{user['id']}/stores",
            json={"store_ids": ["walmart", "target"]}
        )
        
        # Enable manufacturer coupons
        requests.put(
            f"{BASE_URL}/api/users/{user['id']}/manufacturer-coupons",
            json={"enabled": True}
        )
        
        return user
    
    def test_get_coupon_bundles(self, user_with_stores):
        """Test getting coupon bundles for user"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/coupon-bundles")
        assert response.status_code == 200
        data = response.json()
        
        # Verify structure
        assert "store_bundles" in data
        assert "manufacturer_bundle" in data
        assert "week_of" in data
        assert "total_store_bundles" in data
        
        # Should have 2 store bundles (walmart, target)
        assert len(data["store_bundles"]) == 2
        
        # Verify store bundle structure
        bundle = data["store_bundles"][0]
        assert "id" in bundle
        assert "store_id" in bundle
        assert "store_name" in bundle
        assert "store_logo" in bundle
        assert "qr_code_data" in bundle
        assert "coupons" in bundle
        assert "coupon_count" in bundle
        assert "valid_from" in bundle
        assert "valid_until" in bundle
        assert "total_savings" in bundle
        
        # Verify coupons exist
        assert len(bundle["coupons"]) > 0
        coupon = bundle["coupons"][0]
        assert "id" in coupon
        assert "title" in coupon
        assert "description" in coupon
        assert "savings" in coupon
        
        # Verify manufacturer bundle exists (since enabled)
        assert data["manufacturer_bundle"] is not None
        mfr_bundle = data["manufacturer_bundle"]
        assert "qr_code_data" in mfr_bundle
        assert "coupons" in mfr_bundle
        assert len(mfr_bundle["coupons"]) > 0
    
    def test_get_coupon_bundles_no_stores(self):
        """Test getting bundles for user with no stores"""
        import uuid
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"TEST_nostores_{unique_id}@test.com",
            "name": f"TEST No Stores {unique_id}"
        }
        
        # Create user without stores
        create_response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        user_id = create_response.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/coupon-bundles")
        assert response.status_code == 200
        data = response.json()
        
        # Should have empty store bundles
        assert data["store_bundles"] == []
        assert data["total_store_bundles"] == 0
        # No manufacturer bundle since not enabled
        assert data["manufacturer_bundle"] is None
    
    def test_get_qr_code_for_store_bundle(self, user_with_stores):
        """Test getting QR code for a specific store bundle"""
        user_id = user_with_stores["id"]
        
        # Get bundles first
        bundles_response = requests.get(f"{BASE_URL}/api/users/{user_id}/coupon-bundles")
        bundle = bundles_response.json()["store_bundles"][0]
        bundle_id = bundle["id"]
        
        # Get QR code
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/qr/{bundle_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "qr_data" in data
        assert "type" in data
        assert data["type"] == "store"
        assert "store" in data
    
    def test_get_qr_code_for_manufacturer_bundle(self, user_with_stores):
        """Test getting QR code for manufacturer bundle"""
        user_id = user_with_stores["id"]
        
        # Get bundles first
        bundles_response = requests.get(f"{BASE_URL}/api/users/{user_id}/coupon-bundles")
        mfr_bundle = bundles_response.json()["manufacturer_bundle"]
        bundle_id = mfr_bundle["id"]
        
        # Get QR code
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/qr/{bundle_id}")
        assert response.status_code == 200
        data = response.json()
        
        assert "qr_data" in data
        assert "type" in data
        assert data["type"] == "manufacturer"


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
