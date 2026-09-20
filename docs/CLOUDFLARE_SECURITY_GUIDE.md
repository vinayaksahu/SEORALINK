# Cloudflare Security & Anti-DDoS Setup Guide for SEORALINK

Yeh guide **seoralink.com** ko Cloudflare ke enterprise-grade security layer aur Web Application Firewall (WAF) se protect karne ke liye banayi gayi hai.

---

## 1. Cloudflare par Domain Add karna (Free Tier)

1. [Cloudflare.com](https://dash.cloudflare.com/) par account create karein aur login karein.
2. **"Add a Domain"** par click karke `seoralink.com` enter karein.
3. Plan me **Free Plan ($0)** select karein aur continue karein.
4. Cloudflare aapko **2 Nameservers** dega (jaise `ns1.cloudflare.com`, `ns2.cloudflare.com`).
5. Apne Domain Registrar (GoDaddy, Namecheap, Hostinger, etc.) par jaakar existing Nameservers ko Cloudflare ke Nameservers se replace karein.
6. DNS propagation me 10 se 30 minute lag sakte hain.

---

## 2. DNS Settings (Orange Cloud = Proxy Active)

DNS tab me verify karein:
* **Root Domain (`@` / `seoralink.com`):**
  * Type: `A` (ya `CNAME` if Vercel `cname.vercel-dns.com`)
  * Proxy Status: **Proxied (Orange Cloud ON)**
* **Subdomain (`www`):**
  * Type: `CNAME`
  * Proxy Status: **Proxied (Orange Cloud ON)**

> **Kyu Zaroori Hai?**
> Jab Orange Cloud ON hota hai, toh public internet ko aapke actual hosting/server ka IP address nahi dikhta. Sirf Cloudflare ka protected IP dikhta hai, jo Layer 3 aur Layer 4 DDoS attacks ko origin tak pahunche bina absorb kar leta hai.

---

## 3. SSL/TLS Settings (Strict Encryption)

1. Left sidebar me **SSL/TLS** par click karein.
2. Encryption Mode ko **Full (Strict)** select karein.
3. **Edge Certificates** section me:
   * **Always Use HTTPS:** `ON` karein.
   * **Automatic HTTPS Rewrites:** `ON` karein.
   * **Minimum TLS Version:** `TLS 1.2` ya `TLS 1.3` select karein.

---

## 4. Security Tab: Bot Fight Mode & Security Level

1. **Security > Settings** me:
   * **Security Level:** `Medium` (Normal traffic ke liye best).
   * Agar kabhi site par massive fake attack ho, toh ise temporary **"I'm Under Attack!"** mode me switch kar sakte hain.
   * **Challenge Passage:** `30 minutes`.
2. **Security > Bots** me:
   * **Bot Fight Mode:** `ON` karein (Yeh automated brute-force scripts aur malicious scrapers ko automatic JS challenge deta hai).

---

## 5. Custom WAF (Web Application Firewall) Rules

SEORALINK ke sensitive admin portals ko extra protection dene ke liye WAF Rules banayein:

### Rule 1: Protect Super Root Admin Portal
* Cloudflare Dashboard -> **Security > WAF > Custom Rules > Create Rule**.
* **Rule Name:** `Protect Super Root Admin`
* **Field:** `URI Path`
* **Operator:** `starts with`
* **Value:** `/superrootadmin`
* **Action:** **Managed Challenge** (Isse kisi bot ko access milne se pehle Cloudflare verify karega ki user human hai).

### Rule 2: Protect Authentication API Flooding
* **Rule Name:** `Protect Auth Endpoints`
* **Field:** `URI Path`
* **Operator:** `starts with`
* **Value:** `/api/auth/`
* **Action:** **Managed Challenge** agar Threat Score > 15 ho.

---

## 6. Upstash Redis Setup (Distributed Rate Limiting)

Upstash Redis Next.js serverless instances ke beech distributed token bucket share karta hai:

1. [console.upstash.com](https://console.upstash.com/) par free account banayein.
2. **"Create Database"** par click karein:
   * Name: `seoralink-ratelimit`
   * Type: Regional
   * Region: Primary deployment region select karein (e.g. AWS us-east-1 ya Mumbai ap-south-1).
3. Database dashboard par neeche scroll karein aur **"REST API"** section dekhein.
4. Wahan se do keys copy karein:
   * `UPSTASH_REDIS_REST_URL`
   * `UPSTASH_REDIS_REST_TOKEN`
5. In dono keys ko apne `.env` (aur Vercel / Production Environment Variables) me paste karein:
   ```env
   UPSTASH_REDIS_REST_URL="https://your-upstash-instance.upstash.io"
   UPSTASH_REDIS_REST_TOKEN="AX...=="
   ```

> **Note:** Agar aap Upstash credentials add nahi bhi karte, tab bhi code automatically local in-memory sliding window limiter par safe rahega.
