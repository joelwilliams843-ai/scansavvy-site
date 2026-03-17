"""
Backend API Tests for ScanSavvy Master Bundle System
Tests the new ONE MASTER QR CODE feature with all coupons from selected stores
"""
import pytest
import requests
import os
import uuid

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
        assert data["version"] == "2.0.0"


class TestStoresAPI:
    """Test store-related endpoints"""
    
    def test_get_all_stores(self):
        """Test getting all stores"""
        response = requests.get(f"{BASE_URL}/api/stores")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        assert len(data["stores"]) >= 10  # Should have at least 10 stores
        
        # Verify store structure
        store = data["stores"][0]
        assert "id" in store
        assert "name" in store
        assert "logo" in store
        assert "color" in store
        assert "category" in store
    
    def test_search_stores(self):
        """Test store search functionality"""
        response = requests.get(f"{BASE_URL}/api/stores?search=walmart")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        store_names = [s["name"].lower() for s in data["stores"]]
        assert any("walmart" in name for name in store_names)
    
    def test_filter_stores_by_category(self):
        """Test filtering stores by category"""
        response = requests.get(f"{BASE_URL}/api/stores?category=Grocery")
        assert response.status_code == 200
        data = response.json()
        assert "stores" in data
        for store in data["stores"]:
            assert store["category"].lower() == "grocery"
    
    def test_get_store_categories(self):
        """Test getting unique store categories"""
        response = requests.get(f"{BASE_URL}/api/stores/categories")
        assert response.status_code == 200
        data = response.json()
        assert "categories" in data
        categories = [c.lower() for c in data["categories"]]
        assert "grocery" in categories


class TestUsersAPI:
    """Test user-related endpoints"""
    
    @pytest.fixture
    def test_user_data(self):
        """Test user data for creation"""
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
        assert "tier" in data
        assert "created_at" in data
        
        # Default values
        assert data["selected_stores"] == []
        assert data["manufacturer_coupons_enabled"] == False
        assert data["notification_method"] == "push"
        assert data["tier"] == "free"
    
    def test_get_user_by_id(self, test_user_data):
        """Test getting user by ID"""
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}")
        assert response.status_code == 200
        data = response.json()
        assert data["id"] == user_id
        assert data["email"] == test_user_data["email"]
    
    def test_get_nonexistent_user_returns_404(self):
        """Test getting non-existent user returns 404"""
        response = requests.get(f"{BASE_URL}/api/users/nonexistent-id-12345")
        assert response.status_code == 404
    
    def test_update_user_stores(self, test_user_data):
        """Test updating user's selected stores"""
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
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
    
    def test_update_notification_method(self, test_user_data):
        """Test updating notification method"""
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        for method in ["sms", "email", "push"]:
            response = requests.put(
                f"{BASE_URL}/api/users/{user_id}/notification-method",
                json={"method": method}
            )
            assert response.status_code == 200
            assert response.json()["notification_method"] == method
    
    def test_invalid_notification_method_returns_400(self, test_user_data):
        """Test invalid notification method returns 400"""
        create_response = requests.post(f"{BASE_URL}/api/users", json=test_user_data)
        user_id = create_response.json()["id"]
        
        response = requests.put(
            f"{BASE_URL}/api/users/{user_id}/notification-method",
            json={"method": "invalid"}
        )
        assert response.status_code == 400


class TestMasterBundleAPI:
    """Test the new Master Bundle system - ONE QR code for ALL coupons"""
    
    @pytest.fixture
    def user_with_stores(self):
        """Create a user with selected stores and manufacturer coupons enabled"""
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
            json={"store_ids": ["walmart", "target", "kroger"]}
        )
        
        # Enable manufacturer coupons
        requests.put(
            f"{BASE_URL}/api/users/{user['id']}/manufacturer-coupons",
            json={"enabled": True}
        )
        
        return user
    
    def test_get_master_bundle_structure(self, user_with_stores):
        """P0: Test master bundle contains all required fields"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        assert response.status_code == 200
        data = response.json()
        
        # Verify has_bundle flag
        assert data["has_bundle"] == True
        
        # Verify bundle structure
        bundle = data["bundle"]
        assert "id" in bundle
        assert "qr_url" in bundle
        assert "week_label" in bundle
        assert "valid_until" in bundle
        assert "coupon_count" in bundle
        assert "total_savings" in bundle
        assert "stores_included" in bundle
        assert "coupons" in bundle
        assert "manufacturer_coupons_included" in bundle
        assert "bundle_type" in bundle
    
    def test_master_bundle_contains_all_store_coupons(self, user_with_stores):
        """P0: Test master bundle contains coupons from ALL selected stores"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle = response.json()["bundle"]
        
        # Get unique store_ids from coupons
        store_ids_in_coupons = set(c["store_id"] for c in bundle["coupons"] if c["store_id"])
        
        # Should have coupons from walmart, target, kroger
        assert "walmart" in store_ids_in_coupons
        assert "target" in store_ids_in_coupons
        assert "kroger" in store_ids_in_coupons
        
        # Verify stores_included matches
        stores_included_ids = [s["id"] for s in bundle["stores_included"]]
        assert "walmart" in stores_included_ids
        assert "target" in stores_included_ids
        assert "kroger" in stores_included_ids
    
    def test_master_bundle_includes_manufacturer_coupons(self, user_with_stores):
        """P0: Test master bundle includes manufacturer coupons when enabled"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle = response.json()["bundle"]
        
        # Should have manufacturer coupons (store_id is None)
        manufacturer_coupons = [c for c in bundle["coupons"] if c["store_id"] is None]
        assert len(manufacturer_coupons) > 0
        assert bundle["manufacturer_coupons_included"] == True
    
    def test_master_bundle_coupon_structure(self, user_with_stores):
        """P0: Test each coupon in bundle has correct structure"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle = response.json()["bundle"]
        
        for coupon in bundle["coupons"]:
            assert "id" in coupon
            assert "title" in coupon
            assert "description" in coupon
            assert "savings_value" in coupon
            assert "savings_type" in coupon
            assert "category" in coupon
            assert coupon["savings_type"] in ["dollar", "percent", "bogo"]
    
    def test_master_bundle_qr_url_format(self, user_with_stores):
        """P0: Test QR URL points to bundle view page"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle = response.json()["bundle"]
        
        # QR URL should contain bundle ID and /view endpoint
        assert bundle["id"] in bundle["qr_url"]
        assert "/api/bundle/" in bundle["qr_url"]
        assert "/view" in bundle["qr_url"]
    
    def test_bundle_view_page_returns_html(self, user_with_stores):
        """P0: Test QR scan page returns mobile-friendly HTML"""
        user_id = user_with_stores["id"]
        
        # Get bundle first
        bundle_response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle_id = bundle_response.json()["bundle"]["id"]
        
        # Access the view page
        response = requests.get(f"{BASE_URL}/api/bundle/{bundle_id}/view")
        assert response.status_code == 200
        assert "text/html" in response.headers.get("content-type", "")
        
        # Verify HTML contains key elements
        html = response.text
        assert "ScanSavvy" in html
        assert "Coupon Bundle" in html
        assert "viewport" in html  # Mobile-friendly meta tag
    
    def test_bundle_view_page_shows_coupons(self, user_with_stores):
        """P0: Test QR scan page shows all coupons"""
        user_id = user_with_stores["id"]
        
        bundle_response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        bundle_id = bundle_response.json()["bundle"]["id"]
        
        response = requests.get(f"{BASE_URL}/api/bundle/{bundle_id}/view")
        html = response.text
        
        # Should show coupon titles
        assert "$5 OFF" in html or "OFF" in html
        assert "Included Coupons" in html
    
    def test_bundle_view_page_not_found(self):
        """Test non-existent bundle returns 404 page"""
        response = requests.get(f"{BASE_URL}/api/bundle/NONEXISTENT123/view")
        assert response.status_code == 404
        assert "Bundle Not Found" in response.text
    
    def test_refresh_bundle(self, user_with_stores):
        """P1: Test bundle refresh generates new bundle"""
        user_id = user_with_stores["id"]
        
        # Get original bundle
        original_response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        original_id = original_response.json()["bundle"]["id"]
        
        # Refresh bundle
        refresh_response = requests.post(f"{BASE_URL}/api/users/{user_id}/bundle/refresh")
        assert refresh_response.status_code == 200
        data = refresh_response.json()
        
        assert data["success"] == True
        assert "bundle" in data
        
        # New bundle should have different ID
        new_id = data["bundle"]["id"]
        assert new_id != original_id
    
    def test_no_bundle_without_stores(self):
        """Test user without stores gets no bundle message"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"TEST_nostores_{unique_id}@test.com",
            "name": f"TEST No Stores {unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        user_id = create_response.json()["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/bundle")
        assert response.status_code == 200
        data = response.json()
        
        assert data["has_bundle"] == False
        assert "message" in data


class TestLegacyEndpoints:
    """Test legacy endpoints for backward compatibility"""
    
    @pytest.fixture
    def user_with_stores(self):
        """Create a user with selected stores"""
        unique_id = str(uuid.uuid4())[:8]
        user_data = {
            "email": f"TEST_legacy_{unique_id}@test.com",
            "name": f"TEST Legacy User {unique_id}"
        }
        
        create_response = requests.post(f"{BASE_URL}/api/users", json=user_data)
        user = create_response.json()
        
        requests.put(
            f"{BASE_URL}/api/users/{user['id']}/stores",
            json={"store_ids": ["walmart", "target"]}
        )
        
        requests.put(
            f"{BASE_URL}/api/users/{user['id']}/manufacturer-coupons",
            json={"enabled": True}
        )
        
        return user
    
    def test_legacy_coupon_bundles_endpoint(self, user_with_stores):
        """Test legacy /coupon-bundles endpoint still works"""
        user_id = user_with_stores["id"]
        
        response = requests.get(f"{BASE_URL}/api/users/{user_id}/coupon-bundles")
        assert response.status_code == 200
        data = response.json()
        
        # Should have master_bundle in response
        assert "master_bundle" in data or "store_bundles" in data


if __name__ == "__main__":
    pytest.main([__file__, "-v"])
