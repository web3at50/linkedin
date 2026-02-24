
I have a project which I would like you to help me plan and implement please I would like the ability to be able to target people on Linkedin like target on identify and target people on a team who we want to message our business is selling software to UK education so primarily schools So we want to people in and around that industry Ideally the key decision makers but basically people who are in education and schools and in my 12 be interested in our software So we want to identify these people then we want to be able to search and Exp Their activity by activity is posts they write posts they like posts they comment on and things like that We have a plan which has already been created or more of a research document that has already been created C:\Users\bryn\Documents\linkedin\PRD-LINKEDIN-DASHBOARD.md

this identifies the following Github reposit which does apparently pretty much or very close to what we want and it's open source and so I believe we can clone this and then with some tweaks and edits which are going to now use to do what we want to do I'd like you look at the documents I gave you above with the proposed and plan also you look at the IT UP Repository and Justice confirm whether you think this is suitable for our needs We'd want to build a little front end dashboard using next.Js with Supabase auth so that we can sign in and make searches and new results So we want to see the people their contact details their Prof the posts they've made for liking and links to them all this sort of thing you in the dashboard and which can be exported whether you then we will review manually to then put sending them dMS or other outreach

they have already set up a supabase project within our organisation and I have linked it to this code based this directory here either below or in the keys.Md directory and file there are the Super bass credentials I have also set up config.toml as it's very limited as we don't have a local instance of Super Bass when we just work live

we want to use Vercelle AI SDK 6 which I believe is part of this repository which we're cloning again in the keys dot I have added both an Anthropic API key but also a vercel api gateway apartment

I have already created a Github repository for sales which you can use for this project so I'd like you to set up Git and Github and link it all et cetera et cetera Wanted to get up I will then deploy into a new vercel Project

there are some other little details and specifics about the stack copied below which I would like you to read and use and be aware of and implement There are also three images and screenshots attached which have some information

I will put you in plan mode so that you can read all the documents Make your assessment as of if this is a good approach first to take and that would be a good way to implement and create the project Obviously you can ask any questions and clarifications needed

I have never used Prisma before so I could need some help with that and if there's anything I need to do. I have also never used Bright Data before either and I believe the costs are quite negligible for Bright Data?

github repo to clone: t https://github.com/MeirKaD/pepolehub

Next.js 16.1.6
Proxy.ts not middleware.ts on next.js 16

Use the src route as per screenshot and place that within a directory called frontend which you can create - example setup from another codebase screenshot attached

Vercel AI SDK6

Already setup with lited scope as we dont have a local instance and we push everything live.  Supabase project already setup and linked to this codebase C:\Users\bryn\Documents\linkedin\supabase\config.toml

Project url: https://mspjqhokatfuzqfaizxf.supabase.co

Project ID: mspjqhokatfuzqfaizxf

Publishable API Key: sb_publishable_sQH2CuhALoChsl-1dtoBWg_QQpBrico

Github repo: https://github.com/web3at50/linkedin


C:\Users\bryn\Documents\linkedin\PRD-LINKEDIN-DASHBOARD.md

add C:\Users\bryn\Documents\linkedin\Keys to .gitignore in root directory

We have Anthropic but also vercel gateway api keys in the C:\Users\bryn\Documents\linkedin\Keys\Keys.md directory ad I would prefer vercel gateway please asit comes with the SDK and it means we can swap models easily - start with these models with anthropic/claude-sonnet-4.6 as default


anthropic/claude-haiku-4.5
openai/gpt-5-mini
anthropic/claude-sonnet-4.6

