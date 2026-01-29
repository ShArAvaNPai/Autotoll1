import requests
import datetime

BASE_URL = "http://localhost:8000"

def test_location_reports():
    print("Testing Location and Reports...")

    # 1. Create Owner & Vehicle
    print("Creating Asset...")
    res = requests.post(f"{BASE_URL}/api/owners", data={"name": "Loc Tester", "contact_info": "999"})
    if not res.ok: return print("Failed to create owner")
    owner_id = res.json()['id']
    
    plate = "LOC888"
    requests.post(f"{BASE_URL}/api/vehicles", params={"license_plate": plate, "make_model": "Loc Car", "owner_id": owner_id})
    requests.post(f"{BASE_URL}/api/owner/add_balance", data={"license_plate": plate, "amount": 500})
    
    # 2. Simulate Scans
    # We need to hit /analyze. Since we can't easily mock file upload and get a valid detection without a real model/image match,
    # we will look at the endpoint code. The endpoint requires a file.
    # We will upload a dummy file. The model might fail to read a plate, returning "UNKNOWN".
    # BUT we want to verify LOCATION is saved. Even for unknown.
    
    # 3. Simulate Scans with Real Image
    print("Scanning at MANIPAL...")
    files = {'file': open('test_image.jpg', 'rb')}
    res = requests.post(f"{BASE_URL}/analyze", data={'location': 'MANIPAL'}, files=files)
    print("Scan Res:", res.json().get('status') or res.json())
    
    # Re-open file for second read
    print("Scanning at UDUPI...")
    files = {'file': open('test_image.jpg', 'rb')}
    res = requests.post(f"{BASE_URL}/analyze", data={'location': 'UDUPI'}, files=files)
    print("Scan Res:", res.json().get('status') or res.json())

    # 3. Verify History
    print("Verifying History...")
    res = requests.get(f"{BASE_URL}/api/history", params={'location': 'MANIPAL'})
    history_manipal = res.json()
    if any(h.get('location') == 'MANIPAL' for h in history_manipal):
        print("SUCCESS: Found MANIPAL entry in history.")
    else:
        print("FAILURE: No MANIPAL entry found.")
        print(history_manipal[:2])

    # 4. Verify Reports
    print("Verifying Reports...")
    res = requests.get(f"{BASE_URL}/api/reports/monthly", params={'location': 'MANIPAL'})
    report = res.json()
    print("Manipal Report:", report['total_visitors'])
    
    if report['total_visitors'] > 0:
        print("SUCCESS: Report shows visitors.")
    else:
        print("FAILURE: Report empty.")

if __name__ == "__main__":
    try:
        test_location_reports()
    except Exception as e:
        print(f"Error: {e}")
