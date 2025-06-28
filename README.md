# AdSnitch 
_Your TinyLlama-powered Discord tattletale that exposes the shady world of DNS requests — with sarcasm._

## What is AdSnitch?

AdSnitch is a satirical Discord bot that spies on your Pi-hole or AdGuard Home logs and delivers **daily roast-style summaries** of blocked DNS requests. Think of it as your passive-aggressive network admin with a flair for drama, powered by TinyLlama.

Every day, AdSnitch reports:
- The worst offenders (looking at you, `telemetry.yourTV.com`)
- Suspicious patterns (`why-do-you-need-20-ad-requests-in-a-minute.com`)
- Absurd domains you didn't know existed
- And all this, with a generous sprinkle of snark, sarcasm, and LLM-generated wit

## Why?

Because knowing that your smart fridge is trying to contact 12 tracking domains daily *deserves commentary*.  
Because laughter is the best firewall.  
Because... why not?

## Features

- **Daily summaries** of DNS blocklists
- **Powered by TinyLlama** via `node-llama-cpp` for intelligent (and satirical) report generation
- **Discord bot** integration with clean embeds
- Supports **Pi-hole** and **AdGuard Home** as data sources
- Fully customizable tone: sarcastic, serious, sysadmin-rage, or Munna Bhai-style
- **Domain intelligence** lookup via RDAP for context-aware summaries

## Screenshots

> _"The award for Most Blocked Domain goes to... `ads.doubleclick.net`, again. Yawn."_  
> _"Congratulations, your Wi-Fi light bulb just attempted to sell your soul 48 times today."_

![Example Report Embed](https://your-screenshot-url.com)

## How it Works

1. Parse DNS logs from Pi-hole / AdGuard Home (via API or log scrape).
2. Aggregate daily request data (blocked domains, counts, time trends).
3. Look up domain details via RDAP (or your custom API) and local `domains.db`.
4. Use TinyLlama (through `node-llama-cpp`) to craft a satirical summary.
5. Send report as a Discord embed to your channel.

## Installation

```bash
git clone https://github.com/babanomania/adsnitch.git
cd adsnitch
npm install
cp .env.example .env   # Set up your bot token and Pi-hole/AdGuard details
npm run start
````

## Configuration

| Variable        | Description                                  |
| --------------- | -------------------------------------------- |
| `DISCORD_TOKEN` | Your Discord bot token                       |
| `PIHOLE_URL`    | Pi-hole API or log file path                 |
| `ADGUARD_URL`   | (Optional) AdGuard Home API base URL         |
| `MODEL_PATH`    | Path to TinyLlama model for local inference  |
| `REPORT_TIME`   | Time of day to send daily summaries (HH\:MM) |
| `DOMAIN_INFO_API` | API endpoint for domain lookups |

## TODOs

* [ ] Web UI for configuring tone presets
* [ ] Support for other DNS filters (e.g., NextDNS, Unbound)
* [ ] Add meme mode
* [ ] Add Munna Bhai mode

## License

MIT. Just don’t use this to actually manage DNS security. It’s here for fun and giggles.

## Contribute

Pull requests welcome. Add your own flavor of sarcasm to the bot.

## Disclaimer

AdSnitch is not responsible if your coworkers start relying on it more than actual monitoring tools.

---

> *“If it’s blocked, AdSnitch is watching… and judging.”*
