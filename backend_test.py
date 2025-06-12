#!/usr/bin/env python3
import requests
import json
import time
from datetime import datetime, timedelta
import sys
import uuid

# Backend URL
BACKEND_URL = "http://localhost:8001"
API_BASE = f"{BACKEND_URL}/api"

# Test data with unique identifiers
timestamp = int(time.time())
test_client = {
    "name": f"Test Client {timestamp}",
    "email": f"test{timestamp}@example.com",
    "phone": "+1234567890",
    "address": "123 Test Street, Test City",
    "is_active": True
}

# Store IDs for cleanup
client_id = None
project_id = None
time_entry_id = None
invoice_id = None

def print_test_result(name, success, message=""):
    if success:
        print(f"✅ {name}: Passed {message}")
        return True
    else:
        print(f"❌ {name}: Failed {message}")
        return False

def test_health_check():
    """Test health check endpoint"""
    response = requests.get(f"{API_BASE}/health")
    success = response.status_code == 200 and response.json()["status"] == "healthy"
    return print_test_result("Health Check", success)

def test_root_endpoint():
    """Test root endpoint"""
    response = requests.get(f"{API_BASE}/")
    success = response.status_code == 200 and response.json()["message"] == "TimeTracker API is running"
    return print_test_result("Root Endpoint", success)

def test_create_client():
    """Test client creation"""
    global client_id
    response = requests.post(f"{API_BASE}/clients", json=test_client)
    if response.status_code != 200:
        return print_test_result("Client Creation", False, f"Status: {response.status_code}, Response: {response.text}")
    
    client = response.json()
    client_id = client["id"]
    success = (
        client["name"] == test_client["name"] and
        client["email"] == test_client["email"]
    )
    return print_test_result("Client Creation", success, f"ID: {client_id}")

def test_get_clients():
    """Test getting all clients"""
    response = requests.get(f"{API_BASE}/clients")
    success = response.status_code == 200 and isinstance(response.json(), list)
    return print_test_result("Get All Clients", success)

def test_get_client():
    """Test getting a specific client"""
    global client_id
    if not client_id:
        return print_test_result("Get Client", False, "No client ID available")
    
    response = requests.get(f"{API_BASE}/clients/{client_id}")
    success = response.status_code == 200 and response.json()["id"] == client_id
    return print_test_result("Get Client", success)

def test_update_client():
    """Test updating a client"""
    global client_id
    if not client_id:
        return print_test_result("Update Client", False, "No client ID available")
    
    update_data = {"name": f"Updated Client {timestamp}"}
    response = requests.put(f"{API_BASE}/clients/{client_id}", json=update_data)
    success = response.status_code == 200 and response.json()["name"] == update_data["name"]
    return print_test_result("Update Client", success)

def test_create_project():
    """Test project creation"""
    global client_id, project_id
    if not client_id:
        return print_test_result("Project Creation", False, "No client ID available")
    
    project_data = {
        "name": f"Test Project {timestamp}",
        "description": "A test project for API testing",
        "client_id": client_id,
        "hourly_rate": 100.0,
        "currency": "USD",
        "start_date": datetime.now().strftime("%Y-%m-%d"),
        "end_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "status": "active"
    }
    
    response = requests.post(f"{API_BASE}/projects", json=project_data)
    if response.status_code != 200:
        return print_test_result("Project Creation", False, f"Status: {response.status_code}, Response: {response.text}")
    
    project = response.json()
    project_id = project["id"]
    success = (
        project["name"] == project_data["name"] and
        project["client_id"] == client_id
    )
    return print_test_result("Project Creation", success, f"ID: {project_id}")

def test_get_projects():
    """Test getting all projects"""
    response = requests.get(f"{API_BASE}/projects")
    success = response.status_code == 200 and isinstance(response.json(), list)
    return print_test_result("Get All Projects", success)

def test_get_project():
    """Test getting a specific project"""
    global project_id
    if not project_id:
        return print_test_result("Get Project", False, "No project ID available")
    
    response = requests.get(f"{API_BASE}/projects/{project_id}")
    success = response.status_code == 200 and response.json()["id"] == project_id
    return print_test_result("Get Project", success)

def test_update_project():
    """Test updating a project"""
    global project_id
    if not project_id:
        return print_test_result("Update Project", False, "No project ID available")
    
    update_data = {"name": f"Updated Project {timestamp}", "hourly_rate": 120.0}
    response = requests.put(f"{API_BASE}/projects/{project_id}", json=update_data)
    success = (
        response.status_code == 200 and 
        response.json()["name"] == update_data["name"] and
        response.json()["hourly_rate"] == update_data["hourly_rate"]
    )
    return print_test_result("Update Project", success)

def test_create_time_entry():
    """Test time entry creation"""
    global project_id, time_entry_id
    if not project_id:
        return print_test_result("Time Entry Creation", False, "No project ID available")
    
    time_entry_data = {
        "project_id": project_id,
        "description": f"Test time entry {timestamp}",
        "duration": 60,  # 60 minutes
        "date": datetime.now().strftime("%Y-%m-%d"),
        "is_manual": True
    }
    
    response = requests.post(f"{API_BASE}/time-entries", json=time_entry_data)
    if response.status_code != 200:
        return print_test_result("Time Entry Creation", False, f"Status: {response.status_code}, Response: {response.text}")
    
    time_entry = response.json()
    time_entry_id = time_entry["id"]
    success = (
        time_entry["description"] == time_entry_data["description"] and
        time_entry["project_id"] == project_id
    )
    return print_test_result("Time Entry Creation", success, f"ID: {time_entry_id}")

def test_get_time_entries():
    """Test getting all time entries"""
    response = requests.get(f"{API_BASE}/time-entries")
    success = response.status_code == 200 and isinstance(response.json(), list)
    return print_test_result("Get All Time Entries", success)

def test_get_time_entry():
    """Test getting a specific time entry"""
    global time_entry_id
    if not time_entry_id:
        return print_test_result("Get Time Entry", False, "No time entry ID available")
    
    response = requests.get(f"{API_BASE}/time-entries/{time_entry_id}")
    success = response.status_code == 200 and response.json()["id"] == time_entry_id
    return print_test_result("Get Time Entry", success)

def test_update_time_entry():
    """Test updating a time entry"""
    global time_entry_id
    if not time_entry_id:
        return print_test_result("Update Time Entry", False, "No time entry ID available")
    
    update_data = {"description": f"Updated time entry {timestamp}", "duration": 90}
    response = requests.put(f"{API_BASE}/time-entries/{time_entry_id}", json=update_data)
    success = (
        response.status_code == 200 and 
        response.json()["description"] == update_data["description"] and
        response.json()["duration"] == update_data["duration"]
    )
    return print_test_result("Update Time Entry", success)

def test_timer_functionality():
    """Test timer functionality"""
    global project_id
    if not project_id:
        return print_test_result("Timer Functionality", False, "No project ID available")
    
    # Start timer
    timer_data = {
        "project_id": project_id,
        "description": f"Test timer {timestamp}"
    }
    
    start_response = requests.post(f"{API_BASE}/timer/start", json=timer_data)
    if start_response.status_code != 200:
        return print_test_result("Timer Start", False, f"Status: {start_response.status_code}, Response: {start_response.text}")
    
    # Get active timer
    get_response = requests.get(f"{API_BASE}/timer/active")
    if get_response.status_code != 200 or get_response.json() is None:
        return print_test_result("Get Active Timer", False, f"Status: {get_response.status_code}, Response: {get_response.text}")
    
    # Wait a bit to accumulate time
    time.sleep(2)
    
    # Stop timer
    stop_response = requests.post(f"{API_BASE}/timer/stop")
    if stop_response.status_code != 200:
        return print_test_result("Timer Stop", False, f"Status: {stop_response.status_code}, Response: {stop_response.text}")
    
    # Verify no active timer
    final_response = requests.get(f"{API_BASE}/timer/active")
    success = final_response.status_code == 200 and final_response.json() is None
    
    return print_test_result("Timer Functionality", success)

def test_create_invoice():
    """Test invoice creation"""
    global client_id, project_id, time_entry_id, invoice_id
    if not client_id or not project_id:
        return print_test_result("Invoice Creation", False, "Missing client or project ID")
    
    invoice_data = {
        "client_id": client_id,
        "project_id": project_id,
        "invoice_number": f"INV-{timestamp}",
        "issue_date": datetime.now().strftime("%Y-%m-%d"),
        "due_date": (datetime.now() + timedelta(days=30)).strftime("%Y-%m-%d"),
        "total_hours": 1.0,
        "total_amount": 100.0,
        "currency": "USD",
        "status": "draft",
        "time_entries": [time_entry_id] if time_entry_id else [],
        "custom_description": f"Test invoice {timestamp}"
    }
    
    response = requests.post(f"{API_BASE}/invoices", json=invoice_data)
    if response.status_code != 200:
        return print_test_result("Invoice Creation", False, f"Status: {response.status_code}, Response: {response.text}")
    
    invoice = response.json()
    invoice_id = invoice["id"]
    success = (
        invoice["client_id"] == client_id and
        invoice["project_id"] == project_id
    )
    return print_test_result("Invoice Creation", success, f"ID: {invoice_id}")

def test_get_invoices():
    """Test getting all invoices"""
    response = requests.get(f"{API_BASE}/invoices")
    success = response.status_code == 200 and isinstance(response.json(), list)
    return print_test_result("Get All Invoices", success)

def test_get_invoice():
    """Test getting a specific invoice"""
    global invoice_id
    if not invoice_id:
        return print_test_result("Get Invoice", False, "No invoice ID available")
    
    response = requests.get(f"{API_BASE}/invoices/{invoice_id}")
    success = response.status_code == 200 and response.json()["id"] == invoice_id
    return print_test_result("Get Invoice", success)

def test_update_invoice():
    """Test updating an invoice"""
    global invoice_id
    if not invoice_id:
        return print_test_result("Update Invoice", False, "No invoice ID available")
    
    update_data = {"status": "sent", "total_amount": 120.0}
    response = requests.put(f"{API_BASE}/invoices/{invoice_id}", json=update_data)
    success = (
        response.status_code == 200 and 
        response.json()["status"] == update_data["status"] and
        response.json()["total_amount"] == update_data["total_amount"]
    )
    return print_test_result("Update Invoice", success)

def test_error_scenarios():
    """Test error scenarios"""
    # Test invalid client email
    invalid_client = {
        "name": "Invalid Client",
        "email": "not-an-email",
        "is_active": True
    }
    response = requests.post(f"{API_BASE}/clients", json=invalid_client)
    email_validation = response.status_code == 422  # Validation error
    
    # Test non-existent client
    response = requests.get(f"{API_BASE}/clients/non-existent-id")
    non_existent = response.status_code == 404
    
    # Test creating project with non-existent client
    invalid_project = {
        "name": "Invalid Project",
        "client_id": "non-existent-id",
        "hourly_rate": 100.0,
        "currency": "USD",
        "status": "active"
    }
    response = requests.post(f"{API_BASE}/projects", json=invalid_project)
    invalid_client_ref = response.status_code == 404
    
    success = email_validation and non_existent and invalid_client_ref
    return print_test_result("Error Scenarios", success)

def cleanup():
    """Clean up created resources"""
    print("\n🧹 Cleaning up test data...")
    
    # Delete in reverse order of creation
    if invoice_id:
        requests.delete(f"{API_BASE}/invoices/{invoice_id}")
        print(f"  Deleted invoice: {invoice_id}")
    
    # Get and delete any time entries created by timer tests
    if project_id:
        time_entries = requests.get(f"{API_BASE}/time-entries").json()
        for entry in time_entries:
            if entry["project_id"] == project_id and entry["id"] != time_entry_id:
                requests.delete(f"{API_BASE}/time-entries/{entry['id']}")
                print(f"  Deleted timer time entry: {entry['id']}")
    
    if time_entry_id:
        requests.delete(f"{API_BASE}/time-entries/{time_entry_id}")
        print(f"  Deleted time entry: {time_entry_id}")
    
    if project_id:
        requests.delete(f"{API_BASE}/projects/{project_id}")
        print(f"  Deleted project: {project_id}")
    
    if client_id:
        requests.delete(f"{API_BASE}/clients/{client_id}")
        print(f"  Deleted client: {client_id}")

def run_tests():
    """Run all tests"""
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
    tests = [
        test_health_check,
        test_root_endpoint,
        test_create_client,
        test_get_clients,
        test_get_client,
        test_update_client,
        test_create_project,
        test_get_projects,
        test_get_project,
        test_update_project,
        test_create_time_entry,
        test_get_time_entries,
        test_get_time_entry,
        test_update_time_entry,
        test_timer_functionality,
        test_create_invoice,
        test_get_invoices,
        test_get_invoice,
        test_update_invoice,
        test_error_scenarios
    ]
    
    results = []
    for test in tests:
        try:
            result = test()
            results.append(result)
        except Exception as e:
            print(f"❌ Exception in {test.__name__}: {e}")
            results.append(False)
    
    # Clean up
    try:
        cleanup()
    except Exception as e:
        print(f"⚠️ Error during cleanup: {e}")
    
    # Print summary
    passed = results.count(True)
    failed = results.count(False)
    total = len(results)
    
    print("\n📊 Test Summary:")
    print(f"  ✅ Passed: {passed}/{total} ({passed/total*100:.1f}%)")
    print(f"  ❌ Failed: {failed}/{total} ({failed/total*100:.1f}%)")
    
    return failed == 0

if __name__ == "__main__":
    success = run_tests()
    sys.exit(0 if success else 1)
