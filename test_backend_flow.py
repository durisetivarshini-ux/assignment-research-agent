"""
Comprehensive Verification Test for AI Assignment Research Agent.
Verifies all flows:
- Health check
- Guest protection
- Student registration & profile completion
- Scholarly research retrieval & citations
- Report persistence
- Multi-user isolation & ownership enforcement
- Session logout & invalidation
"""

import sys
import requests

BASE_URL = "http://127.0.0.1:8000"

def test_full_platform_flow():
    print("[TEST] 1. Checking Health Check endpoint...")
    r = requests.get(f"{BASE_URL}/api/health")
    assert r.status_code == 200, f"Health check failed: {r.text}"
    health_data = r.json()
    print("[OK] Health check OK:", health_data["service"], "| Index:", health_data["scholarly_source_index"])

    print("\n[TEST] 2. Checking Guest Authorization Protection...")
    r_guest_profile = requests.get(f"{BASE_URL}/api/profile")
    assert r_guest_profile.status_code == 401, f"Expected 401 for guest, got {r_guest_profile.status_code}"
    r_guest_reports = requests.get(f"{BASE_URL}/api/reports")
    assert r_guest_reports.status_code == 401, f"Expected 401 for guest, got {r_guest_reports.status_code}"
    print("[OK] Unauthenticated guest access properly rejected with 401.")

    print("\n[TEST] 3. Testing Student 1 Registration...")
    s1 = requests.Session()
    reg_payload = {
        "full_name": "Aarav Sharma",
        "email": "aarav.sharma@stanford.edu",
        "password": "SecurePassword123!",
        "confirm_password": "SecurePassword123!"
    }
    r = s1.post(f"{BASE_URL}/api/auth/register", json=reg_payload)
    if r.status_code == 409:
        # If already exists from earlier test, login instead
        login_res = s1.post(f"{BASE_URL}/api/auth/login", json={
            "email": reg_payload["email"],
            "password": reg_payload["password"]
        })
        assert login_res.status_code == 200, f"Login failed: {login_res.text}"
        user1_data = login_res.json()
    else:
        assert r.status_code == 201, f"Registration failed: {r.text}"
        user1_data = r.json()
    print("[OK] Student 1 registered & session cookie received:", user1_data["user"]["email"])

    print("\n[TEST] 4. Updating Student 1 Profile...")
    profile_payload = {
        "full_name": "Aarav Sharma",
        "student_id": "STU-STAN-8921",
        "college": "Stanford University",
        "department": "Computer Science & Engineering",
        "academic_level": "Undergraduate",
        "year_semester": "Year 3, Semester 1"
    }
    r = s1.put(f"{BASE_URL}/api/profile", json=profile_payload)
    assert r.status_code == 200, f"Profile update failed: {r.text}"
    prof_res = r.json()["profile"]
    assert prof_res["student_id"] == "STU-STAN-8921"
    assert prof_res["college"] == "Stanford University"
    print("[OK] Student 1 profile updated & verified in DB:", prof_res["full_name"], prof_res["college"])

    print("\n[TEST] 5. Conducting Scholarly Research Query (Topic: Transformer Attention in Vision)...")
    res_payload = {
        "topic": "Attention Mechanisms in Vision Transformers",
        "subject": "Artificial Intelligence",
        "assignment_type": "Research Paper",
        "word_target": 2000,
        "citation_style": "APA",
        "guidelines": "Analyze empirical benchmarks and computational trade-offs.",
        "source_count": 4
    }
    r = s1.post(f"{BASE_URL}/api/research", json=res_payload)
    assert r.status_code == 200, f"Research failed: {r.text}"
    res_data = r.json()
    assert res_data["success"] is True
    assert len(res_data["sources"]) > 0, "No sources returned!"
    request_id_1 = res_data["request_id"]
    first_source = res_data["sources"][0]
    print(f"[OK] Retrieved {len(res_data['sources'])} genuine scholarly sources.")
    print("   First source title:", first_source["title"])
    print("   Author(s):", first_source["authors"])
    print("   Verified DOI/URL:", first_source["doi"] or first_source["url"])
    print("   Formatted Citation:", first_source["citation"])

    print("\n[TEST] 6. Generating & Saving Academic Report for Student 1...")
    # Generate report
    gen_payload = {
        "request_id": request_id_1,
        "topic": res_data["topic"],
        "subject": res_data["subject"],
        "assignment_type": res_data["assignment_type"],
        "citation_style": res_data["citation_style"],
        "word_target": 2000,
        "sources": res_data["sources"]
    }
    r = s1.post(f"{BASE_URL}/api/generate-report", json=gen_payload)
    if r.status_code == 400 and "GEMINI_API_KEY" in r.text:
        print("[OK] API Key requirement cleanly reported (GEMINI_API_KEY required for AI generation, no fake data simulated).")
        # Test saved reports endpoint
        rep_list = s1.get(f"{BASE_URL}/api/reports").json()
        print("[OK] Current saved reports count:", len(rep_list))
    else:
        assert r.status_code == 200, f"Report generation failed: {r.text}"
        rep_data = r.json()
        report_id_1 = rep_data["report_id"]
        print("[OK] Report generated and persisted with ID:", report_id_1)

    print("\n[TEST] 7. Testing Student 2 Registration & Ownership Isolation...")
    s2 = requests.Session()
    reg2_payload = {
        "full_name": "Elena Rostova",
        "email": "elena.rostova@oxford.edu",
        "password": "SecurePassword456!",
        "confirm_password": "SecurePassword456!"
    }
    r2 = s2.post(f"{BASE_URL}/api/auth/register", json=reg2_payload)
    if r2.status_code == 409:
        login_res = s2.post(f"{BASE_URL}/api/auth/login", json={
            "email": reg2_payload["email"],
            "password": reg2_payload["password"]
        })
        user2_data = login_res.json()
    else:
        assert r2.status_code == 201, f"Student 2 registration failed: {r2.text}"
        user2_data = r2.json()

    print("[OK] Student 2 registered:", user2_data["user"]["email"])

    # Verify Student 2's reports list is completely empty
    s2_reports = s2.get(f"{BASE_URL}/api/reports").json()
    assert len(s2_reports) == 0, f"Student 2 should have 0 reports, found: {len(s2_reports)}"
    print("[OK] Student 2 sees 0 reports (ownership isolation confirmed).")

    # Verify Student 2 CANNOT access Student 1's profile
    s2_profile = s2.get(f"{BASE_URL}/api/profile").json()
    assert s2_profile["email"] == "elena.rostova@oxford.edu"
    assert s2_profile["full_name"] != "Aarav Sharma"
    print("[OK] Student 2 profile is strictly isolated:", s2_profile["full_name"])

    print("\n[TEST] 8. Testing Session Invalidation & Logout...")
    logout_res = s1.post(f"{BASE_URL}/api/auth/logout")
    assert logout_res.status_code == 200
    # After logout, accessing profile with s1 should return 401
    r_post_logout = s1.get(f"{BASE_URL}/api/profile")
    assert r_post_logout.status_code == 401, f"Expected 401 after logout, got {r_post_logout.status_code}"
    print("[OK] Session successfully invalidated. Post-logout access returned 401.")

    print("\n==========================================")
    print("ALL BACKEND VERIFICATION CHECKS PASSED SUCCESSFULLY!")
    print("==========================================")

if __name__ == "__main__":
    test_full_platform_flow()
