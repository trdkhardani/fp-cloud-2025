from locust import HttpUser, task, between

class FaceRecognitionUser(HttpUser):
    @task
    def recognize_face(self):
        """Mengirim gambar ke endpoint recognize-face"""
        try:
            with open("foto.jpg", "rb") as image:
                files = {
                    "file": ("foto.jpg", image, "image/jpeg")
                }
                print("[RECOGNIZE] Sending request to /api/recognize-face")
                response = self.client.post(
                    "/api/recognize-face", 
                    files=files, 
                    name="/api/recognize-face"
                )
                if response.status_code == 200:
                    result = response.json()
                    if result.get("success") and result.get("employee"):
                        confidence = result.get("confidence", 0.0)
                        print(f"[RECOGNIZE] Recognized: {result['employee']['name']} with confidence {confidence}")
                    else:
                        print(f"[RECOGNIZE] Not recognized or failed: {result.get('message', 'No message')}")
                else:
                    print(f"[RECOGNIZE] Error: {response.status_code} - {response.text}")
        except Exception as e:
            print(f"[RECOGNIZE] Exception: {str(e)}")
