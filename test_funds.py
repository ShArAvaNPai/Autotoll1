import requests

BASE_URL = "http://localhost:8000"

def test_funds():
    print("Testing Funds Management...")

    # 1. Create Owner & Vehicle
    plate = "FUNDS001"
    res = requests.post(f"{BASE_URL}/api/owners", data={"name": "Funds Tester", "contact_info": "555"})
    if not res.ok: return print("Failed to create owner")
    owner_id = res.json()['id']
    
    requests.post(f"{BASE_URL}/api/vehicles", params={"license_plate": plate, "make_model": "Funds Car", "owner_id": owner_id})
    
    # 2. Add Funds (Via new Admin Adjust endpoint)
    print("Adjusting Balance (Add 500)...")
    res = requests.post(f"{BASE_URL}/api/admin/adjust_balance", data={
        "owner_id": owner_id,
        "amount": 500,
        "description": "Test Credit"
    })
    print("Adjust Res:", res.json())
    
    # Verify Transaction
    res = requests.get(f"{BASE_URL}/api/owners/{owner_id}/transactions")
    txs = res.json()
    if txs[0]['amount'] == 500 and txs[0]['type'] == 'ADMIN_ADJUST':
        print("SUCCESS: Admin Add Funds verified.")
    else:
        print("FAILURE: Admin Add Funds transaction missing.", txs)

    # 3. Deduct Funds
    print("Adjusting Balance (Deduct 200)...")
    res = requests.post(f"{BASE_URL}/api/admin/adjust_balance", data={
        "owner_id": owner_id,
        "amount": -200,
        "description": "Test Debit"
    })
    print("Adjust Res:", res.json())
    
    # Verify Balance
    res = requests.get(f"{BASE_URL}/api/owners")
    owners = res.json()
    my_owner = next(o for o in owners if o['id'] == owner_id)
    if my_owner['balance'] == 300: # 500 - 200
        print("SUCCESS: Balance updated correctly to 300.")
    else:
        print(f"FAILURE: Balance incorrect: {my_owner['balance']}")

    # 4. Verify History Endpoint works
    res = requests.get(f"{BASE_URL}/api/owners/{owner_id}/transactions")
    if len(res.json()) >= 2:
        print("SUCCESS: Transactions retrieved.")
    else:
        print("FAILURE: Transactions count mismatch.")

if __name__ == "__main__":
    try:
        test_funds()
    except Exception as e:
        print(f"Error: {e}")
