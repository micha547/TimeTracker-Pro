#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime, timedelta
import unittest
import sys
import os
from pprint import pprint

# Get the backend URL from the frontend .env file
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

class TimeTrackerAPITest(unittest.TestCase):
    """Test suite for TimeTracker API"""

    def setUp(self):
        """Setup for tests - clear any test data"""
        # Store IDs for cleanup
        self.client_ids = []
        self.project_ids = []
        self.time_entry_ids = []
        self.invoice_ids = []
        
        # Test data
        self.test_client = {
            "name": "Test Client",
            "email": "test@example.com",
            "phone": "+1234567890",
            "address": "123 Test Street, Test City",
            "is_active": True
        }
        
        self.test_project = {
            "name": "Test Project",
            "description": "A test project for API testing",
            "hourly_rate": 100.0,
            "currency": "USD",
            "start_date": datetime.now().strftime("%Y-%m-%d"),
            "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "status": "active"
        }
        
        self.test_time_entry = {
            "description": "Test time entry",
            "duration": 60,  # 60 minutes
            "date": datetime.now().strftime("%Y-%m-%d"),
            "is_manual": True
        }
        
        self.test_invoice = {
            "invoice_number": f"INV-{int(time.time())}",
            "issue_date": datetime.now().strftime("%Y-%m-%d"),
            "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
            "total_hours": 1.0,
            "total_amount": 100.0,
            "currency": "USD",
            "status": "draft",
            "time_entries": [],
            "custom_description": "Test invoice"
        }

    def tearDown(self):
        """Clean up after tests"""
        # Delete created resources in reverse order
        for invoice_id in self.invoice_ids:
            requests.delete(f"{API_BASE}/invoices/{invoice_id}")
        
        for entry_id in self.time_entry_ids:
            requests.delete(f"{API_BASE}/time-entries/{entry_id}")
        
        for project_id in self.project_ids:
            requests.delete(f"{API_BASE}/projects/{project_id}")
        
        for client_id in self.client_ids:
            requests.delete(f"{API_BASE}/clients/{client_id}")

    def test_01_health_check(self):
        """Test health check endpoint"""
        response = requests.get(f"{API_BASE}/health")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["status"], "healthy")
        self.assertIn("timestamp", data)
        print("✅ Health check endpoint working")

    def test_02_root_endpoint(self):
        """Test root endpoint"""
        response = requests.get(f"{API_BASE}/")
        self.assertEqual(response.status_code, 200)
        data = response.json()
        self.assertEqual(data["message"], "TimeTracker API is running")
        print("✅ Root endpoint working")

    def test_03_client_crud(self):
        """Test client CRUD operations"""
        # CREATE
        print(f"Creating client with data: {self.test_client}")
        response = requests.post(f"{API_BASE}/clients", json=self.test_client)
        print(f"Client creation response: {response.status_code}")
        print(f"Response content: {response.text}")
        self.assertEqual(response.status_code, 200)
        client = response.json()
        self.assertIn("id", client)
        self.assertEqual(client["name"], self.test_client["name"])
        self.assertEqual(client["email"], self.test_client["email"])
        
        # Store ID for later use and cleanup
        client_id = client["id"]
        self.client_ids.append(client_id)
        print(f"✅ Created client with ID: {client_id}")
        
        # READ (GET ONE)
        response = requests.get(f"{API_BASE}/clients/{client_id}")
        self.assertEqual(response.status_code, 200)
        client = response.json()
        self.assertEqual(client["id"], client_id)
        print("✅ Retrieved client by ID")
        
        # READ (GET ALL)
        response = requests.get(f"{API_BASE}/clients")
        self.assertEqual(response.status_code, 200)
        clients = response.json()
        self.assertIsInstance(clients, list)
        self.assertGreaterEqual(len(clients), 1)
        print("✅ Retrieved all clients")
        
        # UPDATE
        update_data = {"name": "Updated Test Client", "phone": "+9876543210"}
        response = requests.put(f"{API_BASE}/clients/{client_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_client = response.json()
        self.assertEqual(updated_client["name"], update_data["name"])
        self.assertEqual(updated_client["phone"], update_data["phone"])
        print("✅ Updated client")
        
        # DELETE (will be done in tearDown)
        
        return client_id

    def test_04_project_crud(self):
        """Test project CRUD operations"""
        # First create a client
        client_id = self.test_03_client_crud()
        
        # Add client_id to project data
        self.test_project["client_id"] = client_id
        
        # CREATE
        response = requests.post(f"{API_BASE}/projects", json=self.test_project)
        self.assertEqual(response.status_code, 200)
        project = response.json()
        self.assertIn("id", project)
        self.assertEqual(project["name"], self.test_project["name"])
        self.assertEqual(project["client_id"], client_id)
        
        # Store ID for later use and cleanup
        project_id = project["id"]
        self.project_ids.append(project_id)
        print(f"✅ Created project with ID: {project_id}")
        
        # READ (GET ONE)
        response = requests.get(f"{API_BASE}/projects/{project_id}")
        self.assertEqual(response.status_code, 200)
        project = response.json()
        self.assertEqual(project["id"], project_id)
        print("✅ Retrieved project by ID")
        
        # READ (GET ALL)
        response = requests.get(f"{API_BASE}/projects")
        self.assertEqual(response.status_code, 200)
        projects = response.json()
        self.assertIsInstance(projects, list)
        self.assertGreaterEqual(len(projects), 1)
        print("✅ Retrieved all projects")
        
        # UPDATE
        update_data = {"name": "Updated Test Project", "hourly_rate": 120.0}
        response = requests.put(f"{API_BASE}/projects/{project_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_project = response.json()
        self.assertEqual(updated_project["name"], update_data["name"])
        self.assertEqual(updated_project["hourly_rate"], update_data["hourly_rate"])
        print("✅ Updated project")
        
        # DELETE (will be done in tearDown)
        
        return project_id

    def test_05_time_entry_crud(self):
        """Test time entry CRUD operations"""
        # First create a client and project
        project_id = self.test_04_project_crud()
        
        # Add project_id to time entry data
        self.test_time_entry["project_id"] = project_id
        
        # CREATE
        response = requests.post(f"{API_BASE}/time-entries", json=self.test_time_entry)
        self.assertEqual(response.status_code, 200)
        time_entry = response.json()
        self.assertIn("id", time_entry)
        self.assertEqual(time_entry["description"], self.test_time_entry["description"])
        self.assertEqual(time_entry["project_id"], project_id)
        
        # Store ID for later use and cleanup
        time_entry_id = time_entry["id"]
        self.time_entry_ids.append(time_entry_id)
        print(f"✅ Created time entry with ID: {time_entry_id}")
        
        # READ (GET ONE)
        response = requests.get(f"{API_BASE}/time-entries/{time_entry_id}")
        self.assertEqual(response.status_code, 200)
        time_entry = response.json()
        self.assertEqual(time_entry["id"], time_entry_id)
        print("✅ Retrieved time entry by ID")
        
        # READ (GET ALL)
        response = requests.get(f"{API_BASE}/time-entries")
        self.assertEqual(response.status_code, 200)
        time_entries = response.json()
        self.assertIsInstance(time_entries, list)
        self.assertGreaterEqual(len(time_entries), 1)
        print("✅ Retrieved all time entries")
        
        # UPDATE
        update_data = {"description": "Updated Test Time Entry", "duration": 90}
        response = requests.put(f"{API_BASE}/time-entries/{time_entry_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_time_entry = response.json()
        self.assertEqual(updated_time_entry["description"], update_data["description"])
        self.assertEqual(updated_time_entry["duration"], update_data["duration"])
        print("✅ Updated time entry")
        
        # DELETE (will be done in tearDown)
        
        return time_entry_id

    def test_06_timer_functionality(self):
        """Test timer functionality"""
        # First create a client and project
        project_id = self.test_04_project_crud()
        
        # Start timer
        timer_data = {
            "project_id": project_id,
            "description": "Test timer"
        }
        
        response = requests.post(f"{API_BASE}/timer/start", json=timer_data)
        self.assertEqual(response.status_code, 200)
        timer = response.json()
        self.assertIn("id", timer)
        self.assertEqual(timer["project_id"], project_id)
        self.assertEqual(timer["description"], timer_data["description"])
        print("✅ Started timer")
        
        # Get active timer
        response = requests.get(f"{API_BASE}/timer/active")
        self.assertEqual(response.status_code, 200)
        active_timer = response.json()
        self.assertIsNotNone(active_timer)
        self.assertEqual(active_timer["project_id"], project_id)
        print("✅ Retrieved active timer")
        
        # Wait a bit to accumulate time
        time.sleep(2)
        
        # Stop timer
        response = requests.post(f"{API_BASE}/timer/stop")
        self.assertEqual(response.status_code, 200)
        stop_result = response.json()
        self.assertTrue(stop_result["success"])
        self.assertIn("time_entry", stop_result)
        
        # Add the created time entry to our cleanup list
        self.time_entry_ids.append(stop_result["time_entry"]["id"])
        print("✅ Stopped timer and created time entry")
        
        # Verify no active timer
        response = requests.get(f"{API_BASE}/timer/active")
        self.assertEqual(response.status_code, 200)
        self.assertIsNone(response.json())
        print("✅ No active timer after stopping")

    def test_07_invoice_crud(self):
        """Test invoice CRUD operations"""
        # First create a client, project, and time entry
        client_id = self.test_03_client_crud()
        project_id = self.test_04_project_crud()
        time_entry_id = self.test_05_time_entry_crud()
        
        # Add client_id, project_id, and time_entry_id to invoice data
        self.test_invoice["client_id"] = client_id
        self.test_invoice["project_id"] = project_id
        self.test_invoice["time_entries"] = [time_entry_id]
        
        # CREATE
        response = requests.post(f"{API_BASE}/invoices", json=self.test_invoice)
        self.assertEqual(response.status_code, 200)
        invoice = response.json()
        self.assertIn("id", invoice)
        self.assertEqual(invoice["client_id"], client_id)
        self.assertEqual(invoice["project_id"], project_id)
        
        # Store ID for later use and cleanup
        invoice_id = invoice["id"]
        self.invoice_ids.append(invoice_id)
        print(f"✅ Created invoice with ID: {invoice_id}")
        
        # READ (GET ONE)
        response = requests.get(f"{API_BASE}/invoices/{invoice_id}")
        self.assertEqual(response.status_code, 200)
        invoice = response.json()
        self.assertEqual(invoice["id"], invoice_id)
        print("✅ Retrieved invoice by ID")
        
        # READ (GET ALL)
        response = requests.get(f"{API_BASE}/invoices")
        self.assertEqual(response.status_code, 200)
        invoices = response.json()
        self.assertIsInstance(invoices, list)
        self.assertGreaterEqual(len(invoices), 1)
        print("✅ Retrieved all invoices")
        
        # UPDATE
        update_data = {"status": "sent", "total_amount": 120.0}
        response = requests.put(f"{API_BASE}/invoices/{invoice_id}", json=update_data)
        self.assertEqual(response.status_code, 200)
        updated_invoice = response.json()
        self.assertEqual(updated_invoice["status"], update_data["status"])
        self.assertEqual(updated_invoice["total_amount"], update_data["total_amount"])
        print("✅ Updated invoice")
        
        # DELETE (will be done in tearDown)

    def test_08_error_scenarios(self):
        """Test error scenarios"""
        # Test invalid client email
        invalid_client = {
            "name": "Invalid Client",
            "email": "not-an-email",
            "is_active": True
        }
        response = requests.post(f"{API_BASE}/clients", json=invalid_client)
        self.assertEqual(response.status_code, 422)  # Validation error
        print("✅ Validation error for invalid email")
        
        # Test non-existent client
        response = requests.get(f"{API_BASE}/clients/non-existent-id")
        self.assertEqual(response.status_code, 404)
        print("✅ 404 error for non-existent client")
        
        # Test creating project with non-existent client
        invalid_project = {
            "name": "Invalid Project",
            "client_id": "non-existent-id",
            "hourly_rate": 100.0,
            "currency": "USD",
            "status": "active"
        }
        response = requests.post(f"{API_BASE}/projects", json=invalid_project)
        self.assertEqual(response.status_code, 404)
        print("✅ 404 error for non-existent client in project creation")
        
        # Test deleting client with existing projects
        # First create a client and project
        client_id = self.test_03_client_crud()
        project_id = self.test_04_project_crud()
        
        # Try to delete the client
        response = requests.delete(f"{API_BASE}/clients/{client_id}")
        self.assertEqual(response.status_code, 400)  # Can't delete client with projects
        print("✅ 400 error for deleting client with projects")
        
        # Clean up the project first, then the client
        requests.delete(f"{API_BASE}/projects/{project_id}")
        self.project_ids.remove(project_id)
        
        # Now delete should work
        response = requests.delete(f"{API_BASE}/clients/{client_id}")
        self.assertEqual(response.status_code, 200)
        self.client_ids.remove(client_id)
        print("✅ Successfully deleted client after removing projects")

def run_tests():
    """Run the test suite"""
    print("\n🔍 Starting TimeTracker API Tests...\n")
    
    # Check if the API is available
    try:
        response = requests.get(f"{API_BASE}/health", timeout=5)
        if response.status_code != 200:
            print(f"❌ API is not responding correctly. Status code: {response.status_code}")
            return False
    except requests.exceptions.RequestException as e:
        print(f"❌ Could not connect to the API at {API_BASE}: {e}")
        return False
    
    # Run the tests
    test_suite = unittest.TestLoader().loadTestsFromTestCase(TimeTrackerAPITest)
    test_result = unittest.TextTestRunner(verbosity=2).run(test_suite)
    
    # Print summary
    print("\n📊 Test Summary:")
    print(f"  ✅ Passed: {test_result.testsRun - len(test_result.errors) - len(test_result.failures)}")
    print(f"  ❌ Failed: {len(test_result.failures)}")
    print(f"  ⚠️ Errors: {len(test_result.errors)}")
    
    return test_result.wasSuccessful()

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
