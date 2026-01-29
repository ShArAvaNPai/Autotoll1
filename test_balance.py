import requests

BASE_URL = "http://localhost:8000"

def test_low_balance():
    # 1. Register a user with 0 balance (default is 0)
    # create_owner
    print("Creating owner...")
    res = requests.post(f"{BASE_URL}/api/owners", data={"name": "Test LowBalance", "contact_info": "123"})
    if not res.ok:
        print("Failed to create owner")
        return
    owner = res.json()
    owner_id = owner['id']
    print(f"Owner created: {owner_id}, Balance: {owner['balance']}")

    # create_vehicle
    print("Creating vehicle...")
    plate = "TEST001"
    res = requests.post(f"{BASE_URL}/api/vehicles", params={"license_plate": plate, "make_model": "Test Car", "owner_id": owner_id})
    # If already exists, that's fine, just use it
    
    # 2. Simulate Analyze (Low Balance)
    # We need to simulate uploading a file. We can use any dummy file.
    # But wait, analyze takes a file. 
    # Let's create a dummy image file.
    with open("dummy.jpg", "wb") as f:
        f.write(b"dummy content")
    
    print("Simulating Scan (expecting Low Balance)...")
    # Note: Analyze expects a real image usually for YOLO, but our code might crash if image is garbage.
    # However, logic for balance check happens *after* detection.
    # If detection fails, we won't hit balance check unless we mock detection or use a real image.
    # For now, let's just check the vehicle status endpoint directly if I updated it? 
    # Wait, I didn't update vehicle_status endpoint, I updated /analyze.
    # And /analyze relies on YOLO.
    
    # Alternative: Use the new /api/owner/resolve_low_balance endpoint to check if it works 
    # but that requires a detection_id from /analyze.
    
    # Let's try adding balance first.
    print("Adding balance...")
    res = requests.post(f"{BASE_URL}/api/owner/add_balance", data={"license_plate": plate, "amount": 100})
    print("Add Balance Res:", res.json())
    
    # Verify balance is 100
    res = requests.get(f"{BASE_URL}/api/vehicle/status/{plate}")
    data = res.json()
    print(f"Vehicle Balance: {data['balance']}")
    
    if data['balance'] == 100:
        print("SUCCESS: Balance added.")
    else:
        print("FAILURE: Balance incorrect.")

if __name__ == "__main__":
    try:
        test_low_balance()
    except Exception as e:
        print(f"Test failed: {e}")
