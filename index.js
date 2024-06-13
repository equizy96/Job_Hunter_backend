const express = require('express');
require('dotenv').config();
const bodyParser = require('body-parser');
const nodemailer = require('nodemailer');
const fs = require('fs');
const { GoogleGenerativeAI } = require("@google/generative-ai");
const { createWorker } = require('tesseract.js');
const cors = require('cors');
const app = express();
const port = 3000;

app.use(express.json());
app.use(cors());
app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

const genAI = new GoogleGenerativeAI("AIzaSyBBk40GdC4cwITxkCsgT8vdChRpOUMFNGM");
let transporter = nodemailer.createTransport({
    host: process.env.MAIL_HOST,
    port: process.env.MAIL_PORT,
    secure: true,
    auth: {
        user: process.env.MAIL_USERNAME,
        pass: process.env.MAIL_PASSWORD,
    },
});


app.post('/generate', async (req, res) => {
    try {
        const imageUrl = req.body.imageUrl;
        if (!imageUrl) {
            return res.status(400).json({ error: 'Image URL is required' });
        }

        const worker = await createWorker('eng');
        const { data: { text } } = await worker.recognize(imageUrl);
        generateCoverLetter(text).then((coverLetter) => {
            const formatteredData = formatText(coverLetter);
            res.json({ ocrData: text , aiData:formatteredData  });
           
        }).catch((error) => {
            res.status(500).json({ error: error.message });
        });
        await worker.terminate();
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/send', async (req, res) => {
    try {
        const { to, html , key } = req.body;
        const emailHtml = `
            <html>
                <head>
                    <style>
                        .container {
                            margin: auto;
                            border: 1px solid #ddd;
                            border-radius: 8px;
                            overflow: hidden;
                            float: left;
                            background-color: #fff; /* Added background color */
                        }
                        .container header {
                            background-color: #3b6ae2;
                            padding: 20px;
                        }
                        .container main {
                            padding: 20px;
                        }
                        .container footer {
                            background-color: #f9f9f9;
                            padding: 20px;
                            text-align: center;
                            border-top: 1px solid #ddd;
                        }
                        .download-button {
                            font-family: "Roboto", Sans-serif;
                            font-size: 14px;
                            font-weight: 500;
                            background-color: transparent;
                            background-image: linear-gradient(90deg, #1345E6 0%, #ED239F 100%);
                            border-radius: 10px;
                            padding: 15px 38px;
                            color: white;
                            border: none;
                            cursor: pointer;
                            text-decoration: none;
                            display: inline-block;
                            text-decoration: none !important;
                            color: #fff !important;
                        }
                        .header_box{
                            background-color: transparent;
                            background-image: linear-gradient(90deg, #1345e6 0%, #ed239f 100%);
                            padding: 15px 38px;
                            border: none;
                            text-decoration: none;
                        }

                        .boxpad{
                            margin-left:15px;
                            margin-right:15px;
                            padding:50px
                        }

                        .ftlinks a{
                            text-decoration: none !important;
                            color: #fff !important;
                        }
                        .im{
                            color : #333 !important;
                        }
                        @media (min-width: 768px) {
                            .container {
                                width: 60%;
                            }
                        }

                        @media (max-width: 767px) {
                            .container {
                                width: 100%;
                            }
                            .boxpad{
                                padding:20px;
                            }
                        }

                    </style>
                </head>
                <body style="font-family: Arial, sans-serif; color: #333; margin: 0; padding: 0;">
                    <div class="container">
                        <header class="header_box">
                            <img src="https://udarax.me/wp-content/uploads/2022/05/s1.webp" alt="Uber Logo" style="width: 50px;height:50px">
                        </header>
                        <main style="padding: 20px;">
                            <div class="boxpad" style="">
                                <div>${html}</div>
                                <a class="download-button" href="https://udarax.me/wp-content/uploads/2024/02/Udara-Priyadarshana-CV.pdf">Download CV</a>
                            </div>
                        </main>
                        <footer style="background-color: #000; padding: 20px; text-align: center; border-top: 1px solid #ddd;">
                            <p style="color:#fff">&copy; ${new Date().getFullYear()} Udara Liyanage. All rights reserved.</p>
                            <p style="color:#fff"><a href="https://udarax.me/about/" style="color: #fff; text-decoration: none;">About</a> | <a href="https://github.com/udaraliyanage96cs" style="color: #fff; text-decoration: none;">Github</a> 
                            | <a href="https://www.linkedin.com/in/udara-liyanage-6ba408133/" style="color: #fff; text-decoration: none;">Linkedin</a>
                            | <a href="https://medium.com/@ldudaraliyanage" style="color: #fff; text-decoration: none;">Medium</a></p>
                            <p style="color:#fff">Kalutara South, Sri Lanka</p>
                            <p style="color:#fff !important;text-decoration:none" class="ftlinks">admin@udarax.me | Phone: (+94) 779808015</p>
                        </footer>
                    </div>
                </body>
            </html>
        `;
        send_email(to, emailHtml, key).then((result) => {
            res.json({ result: result});
        })
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});



app.listen(port, () => {
    console.log(`Server is running on http://localhost:${port}`);
});

const cv_data = `
    EDUCATION
    UNIVERSITY OF RUHUNA
    2017 - 2020
    2013 - 2015
    KALUTARA VIDYALAYA
    GCE A/L
    A (Combined Mathematics )
    C (Chemistry )
    S (Physics )
    English
    Sinhala
    LANGUAGES
    Bachelor of Science ( Faculty
    Of Science ) BSc
    GPA: 3.5 / 4.0 (Computer
    Science)
    2016 - 2017
    DREAM TEAM INSTITUTE
    OCJP JAVA Developer
    REFERENCE
    +94 718205066
    aruna@dsc.ruh.ac.lk
    Mr S.A.S Lorensuhewa
    Phone:
    Email :
    Senior Lecturer ( Grade1 ) Department
    of Computer Science University of
    Ruhuna,
    +94 71 455 9 425
    damitha+web@DtechSrilanka.com
    Mr Damitha Weerakoon
    Phone:
    Email :
    D-Tech Sri Lanka / Proprietor
    KNOWLEDGE AREAS
    Programming Languages - PHP , Java , JavaScript , C , Python , C++
    Web Frameworks / Libraries - Laravel , NextJs , ReactJs , Flask , VueJs ,
    Wordpress , Webflow , Bubble.io , Adalo
    Databases (SQL / NoSQL) - MySQL , Ms-SQL , SQLite , PostgreSQL ,
    Firebase , Arduino Cloud , MongoDB
    ABOUT ME
    WORK EXPERIENCE
    ITEK360 (USA) 2020 (DECEMBER) - PRESENT
    Software Engineer
    UDARAX ( Freelancer ) 2019 - Present
    Software Engineer
    Full Stack Web Application Development
    Full Stack Web Application Development
    Full Stack Mobile App Development ( React Native )
    Chrome Extensions Development
    Dewy Business Solutions 2018 - 2019
    Software Developer (Part Time)
    Java Standalone Application Developer
    MORE ABOUT MY PROJECTS
    UDARA LIYANAGE
    SOFTWARE ENGINEER
    CONTACT
    +94 77 980 8015
    admin@udarax.me
    Kalutara South, Sri Lanla
    https://udarax.me/
    Experienced Software Engineer with a demonstrated history of working in
    the Software Development industry. Skilled in different ares like Software and
    Web Development, Robotics IoT and Mathematics. Strong engineering
    professional with a Bachelor of Science - BSc focused on Mathematics and
    computer science from the University of Ruhuna Sri Lanka.
    https://udarax.me/projects/
    https://github.com/udaraliyanage96cs
`;

const project_data = `
    Some of my Projects
    Kadda Telegram Bot
    Introducing Kadda: Your Early-Stage English Learning Companion Bot! - 2024-03-18
    Tech Stack | NodeJS , Google Gemini Pro / Vision AI
    Embark on your English learning journey with Kadda – the beginner-friendly bot designed to support you every step of the way! Deployed on a free server, Kadda may experience occasional downtimes, but don’t let that deter you from experiencing its wealth of features!
    Features:
    Instant Corrections: Submit your sentences and receive instant corrections tailored for beginners. Gain valuable insights into English grammar while learning at your own pace.
    Variety of Expressions: Explore different expressions suitable for beginners, from basic to more advanced, helping you build a solid foundation in English communication.
    Grammar Tips: Receive simplified explanations for common grammar mistakes, specially crafted for beginners. Let Kadda be your friendly grammar coach on your language learning journey.
    Vocabulary Suggestions: Expand your vocabulary with beginner-friendly synonyms and phrases suggested by Kadda. Build confidence in expressing yourself effectively in English.
    Powered by Google Gemini Pro AI: Leveraging the power of Google Gemini Pro AI and developed using Node.js, Kadda provides accurate feedback and guidance to beginners in their language learning endeavors.
    How to Get Started:
    Click on the link to access Kadda: Kadda Bot and begin your English learning adventure today! Keep in mind that as Kadda is in its early stages and deployed on a free server, occasional downtimes may occur. Nevertheless, seize this opportunity to embark on your language learning journey with Kadda!
    Disclaimer: Kadda is for educational purposes only and should not be relied upon as a sole source for language learning.
    Join Kadda now and empower yourself to become proficient in English communication, one step at a time! 🚀 #EnglishLearning #AI #LanguageSkills
    Update :- The app Hits 51K Total Reads within less than 12hours so far (2024-03-19 10.00 AM)
    Kadda Telegram Bot
    JOIN NOW
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition - 2024-03-09
    Tech Stack | Laravel , MySQL
    QuizMaster Inter University Quiz Competition is a web-based software designed to orchestrate and manage an engaging quiz competition akin to the popular television show “Who Wants to Be a Millionaire?” This platform was developed to facilitate a dynamic and interactive experience for participants, organizers, and audiences alike. The competition, held on March 9, 2024, at the Galadari Hotel in Sri Lanka, was organized by Union Assurance, a leading Sri Lankan company, in collaboration with Creative Events, an esteemed event organizing firm.
    Key Features:
    Multi-Round Structure: The software comprises three rounds of challenging multiple-choice questions (MCQs), akin to the format of professional quiz competitions, offering a comprehensive and intellectually stimulating experience for participants.
    Control Panel: A sophisticated control panel empowers the quiz master to efficiently manage quizzes, monitor participant responses, and control the progression of the competition seamlessly. This feature ensures smooth navigation throughout the event.
    Dynamic Sound System: The incorporation of a dynamic sound system enhances the interactive nature of the competition. Sounds are triggered for correct, new, and incorrect answers, enriching the overall experience for participants and audiences.
    Countdown Timer: A countdown timer feature adds an element of suspense and urgency, heightening the competitive atmosphere and keeping participants and audiences engaged throughout the competition.
    Analytics Dashboard: Comprehensive dashboards provide real-time analytics and insights into participant performance, enabling organizers to assess team standings, identify trends, and make informed decisions to enhance the overall competition experience.
    Technological Stack:
    The software is built using Laravel, a robust PHP framework known for its elegant syntax and powerful features. The backend database management system leverages MySQL for efficient data storage and retrieval, ensuring seamless performance and scalability.

    Significance:
    QuizMaster Inter University Quiz Competition serves as a testament to the fusion of cutting-edge technology with the art of event organization. Its successful execution at the esteemed Galadari Hotel underscores its reliability, scalability, and effectiveness in orchestrating high-profile events. This project exemplifies the intersection of innovation and functionality, showcasing my expertise in web development, project management, and client collaboration.

    Conclusion:
    In summary, QuizMaster Inter University Quiz Competition stands as a landmark project in my portfolio, representing my ability to conceptualize, develop, and deploy sophisticated web-based solutions tailored to the unique requirements of prestigious events. Its seamless integration of advanced features, intuitive user interface, and robust backend infrastructure positions it as a premier choice for organizing engaging and memorable quiz competitions on a grand scale.

    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    QuizMaster Inter University Quiz Competition
    askMachan
    Travel Smart and Free with ‘askMachan’: Your Digital Guide to Sri Lanka’s Wonders - 2024-01-20
    Tech Stack | NodeJS , Google Gemini Pro / Vision AI
    Introduction: Embarking on a journey to Sri Lanka? Say hello to your digital travel guru — ‘askMachan,’ the Telegram chat bot designed to transform the way you experience this enchanting destination. In this article, we’ll explore the myriad benefits of using ‘askMachan’ and why it’s a indispensable tool for every traveler.

    chatBot :- https://t.me/askMachan_bot
    webURL :- https://lnkd.in/ggRjzsEq

    Benefits:

    Instant Answers: ‘askMachan’ doesn’t make you wait. Whether you’re curious about the best surfing spots or seeking cultural insights, the chat bot provides instantaneous, accurate responses, ensuring you stay informed and make the most of your time in Sri Lanka.

    24/7 Accessibility: Your travel plans aren’t confined to a schedule, and neither is ‘askMachan.’ Accessible round the clock, this chat bot ensures you have a reliable companion whenever a question arises, be it during a midnight exploration or an early morning adventure.

    Free of Charge: Tight on budget? Fret not! ‘askMachan’ is entirely free to use. Enjoy the benefits of a personalized travel guide without worrying about additional expenses, making it an ideal companion for budget-conscious travelers.

    User-Friendly Interface: Technology should enhance, not complicate, your travel experience. ‘askMachan’ boasts a user-friendly interface, making it accessible to travelers of all levels of tech-savviness. Navigate effortlessly and get the information you need with ease.

    Image-Based Queries: Pictures speak a thousand words. ‘askMachan’ takes this to heart, allowing users to ask questions using images. Wondering about the authenticity of a local market or the beauty of a hidden waterfall? Snap a photo, upload it, and let the bot unravel the story for you.

    Why Use ‘askMachan’:

    Efficiency: Time is precious when exploring a new destination. ‘askMachan’ streamlines your research process, offering instant, curated information that lets you spend less time planning and more time immersing yourself in the wonders of Sri Lanka.

    Local Insights: Don’t just see Sri Lanka; experience it like a local. ‘askMachan’ taps into local knowledge, providing insider tips and recommendations that guide you off the tourist track, ensuring an authentic and enriching adventure.

    Continuous Improvement: Your journey matters, and so does your feedback. ‘askMachan’ values user input, using it to continuously enhance and refine its capabilities. By actively participating and providing feedback, you contribute to the evolution of this dynamic travel tool.

    WordMaster English to English Dictionary Chrome Extension
    WordMaster English to English Dictionary Chrome Extension - 2023-11-29
    Tech Stack | Javascript
    Unlock the power of words with WordMaster, your go-to English to English Dictionary Chrome extension! Seamlessly integrated into your browsing experience, WordMaster allows you to discover the meanings of any English word with just a simple highlight.

    Key Features:

    Instant Word Definitions:
    Effortlessly unveil the meaning of any word in English by highlighting it. WordMaster provides instant definitions right at your fingertips, eliminating the need to switch tabs or open external websites.

    Comprehensive Vocabulary:
    Access a vast database of English words and enrich your vocabulary. Whether you’re a student, writer, or just curious about language, WordMaster has you covered with detailed and comprehensive definitions.

    Contextual Insights:
    Understand words in context with contextual insights. WordMaster not only defines words but also provides usage examples, making it easier for you to grasp the nuances and applications of each term.

    Language Exploration:
    Dive deep into the English language by exploring synonyms, antonyms, and related words for a holistic understanding. WordMaster enhances your linguistic journey, making it an invaluable tool for language enthusiasts.

    Effortless Integration:
    Seamlessly integrated into your Chrome browser, WordMaster is always ready to assist. No need to navigate away from your current page – just highlight, discover, and continue your online exploration with newfound knowledge.

    DOWNLOAD
    whasapp privacy chrome extension
    Whatsapp Privacy Protector. - 2023-11-17
    Tech Stack | Javascript
    Exciting news! 🎉 After a chill week of going through the ropes, I’m thrilled to announce that Google has given the green light for the WhatsApp Privacy Chrome Extension—created by yours truly! Woohoo! 🚀 Ever found yourself in a virtual meeting on Zoom, MS Teams, or Google Meet, trying to share your screen, and felt a tad overwhelmed by the sea of faces, WhatsApp chats, and messages? Fear not! My nifty Chrome extension is here to save the day. With this gem, you can easily hide your WhatsApp chat list, messages, and even user profile photos whenever you feel like it (cue the privacy ninja moves). And when you’re ready to dive back into the chatter, just unhide with a click. It’s that simple! 😌 Feel free to give it a spin, and if you’re up for it, drop a review and comment on the Google page. Much appreciated!
    DOWNLOAD
    DoctorPad
    DoctorPad. - 2023-10-25
    Tech Stack | Laravel , MySQL
    I am proud to present a robust and intuitive web-based system designed specifically to meet the needs of local doctors in efficiently managing their patient records and healthcare processes. Leveraging the power of Laravel, a leading PHP framework, I have crafted a feature-rich application that streamlines the entire patient care lifecycle.
    Key Features:
    Patient Records Management:

    Easily store and organize comprehensive patient profiles, including medical history, personal details, and contact information.
    Upload and manage a variety of medical reports, diagnostic images, and voice records directly within the system for quick reference.
    Diagnostic History Tracking:

    Empower doctors to access and review previous diagnoses and treatments, enabling a more informed and cohesive approach to patient care.
    Effortlessly navigate through the patient’s medical journey to gain insights into their health progression.
    Prescription and Medication Assignment:

    Simplify the prescription process by allowing doctors to assign medications directly through the system.
    Maintain a centralized repository of prescribed medications for each patient, facilitating seamless future reference and medication management.
    Secure and Accessible:

    Implement robust security measures to ensure the confidentiality and integrity of patient data.
    Enable access to the system from anywhere with an internet connection, promoting flexibility and convenience for healthcare professionals.
    User-Friendly Interface:

    Design an intuitive and user-friendly interface, making it easy for doctors to navigate through the system and perform essential tasks efficiently.
    Benefits:

    Efficiency Improvement: Streamline administrative tasks and enhance overall workflow efficiency, allowing doctors to focus more on patient care.

    Data Accessibility: Facilitate quick access to patient information, reducing the time spent on retrieving and managing paper-based records.

    Holistic Patient Management: Enable a holistic approach to patient care by providing a comprehensive view of each patient’s medical history, diagnoses, and treatments.

    This project reflects my commitment to creating practical solutions that address real-world challenges in the healthcare sector. The use of Laravel ensures a scalable and maintainable system, while the thoughtful design promotes user adoption and satisfaction.

    Experience the future of patient management with this innovative system – a testament to my dedication to building solutions that make a meaningful impact in the healthcare domain.


    Effortless Text To Speech Blog Reader. - 2023-01-14
    Tech Stack | Javascript
    A text to speech (TTS) blog reader is a tool that converts written text on a blog or website into spoken words. This technology can be used to make blog content more accessible to individuals with visual impairments or reading difficulties. It can also be used as an alternative way to consume blog content for individuals who prefer listening to reading. The tool typically uses a computer generated voice to read the text aloud, and can be integrated into the blog or website.
    If you need this for your blog ? its only $6. Let me know if you need this.
    DEMO
    yum's the word
    Yum's The Word - 2022-12-28
    Tech Stack | Next Js, Node Js, AI, chatGPT
    Are you tired of staring into your pantry or fridge, wondering what to make for dinner? Look no further! Our app is here to help. With our recipe generator, you can input the ingredients you have on hand and we’ll provide you with a delicious and creative meal idea. No more wasting food or spending hours scouring cookbooks for inspiration. Simply open the app, enter your ingredients, and let us do the work for you. Our recipe generator is perfect for busy home cooks, meal prepare, and anyone looking to save time and money in the kitchen. Give it a try and discover a world of culinary possibilities at your fingertips.
    TRY THIS
    poem generator
    Birthday Poem Generator - 2022-12 -10
    Tech Stack | React Js, Next Js, ChatGPT
    This is a web application and its capable for generate birthday poems using Artificial intelligence. I used chatGPT to generate poems in my application. Users can simply input gender age and hobbies of his friend to the system and then system analyse input and generate most relevant  poem using Artificial Intelligence.
    TRY THIS
    order app
    Exmarts- 2022-12-15
    Tech Stack | Laravel API , PHP , API Integration
    This web application is order management system and that I built for local client to manage his orders, export orders as csv.

    Blog Reader Chrome Extension - 2022-12-04
    Tech Stack | JavaScript
    Hi, I had to read some post on medium for a little work. Reading is quite boring. So I made a small chrome extension to listen while it reads 😌. I want to put it in a different voice later.. 😉😌 Tell me if you are too lazy to read ❤️
    PA tried to integrate this to my blog as well. Medium has this feature 🤐
    content management system
    Eight 25 Media - 2022-11 -01
    Tech Stack | PHP , MySQL
    Its a content management system. That system I built for a local client to help manage her digital content. And also its a some kind of university project as well.
    analysis dashboard
    Dashboard Project - 2022-10 -14
    Tech Stack | PHP , MySQL, JavaScript, ApexCharts.js
    This is a dashboard project. Client asked to analyze data from mysql database and display it on the web dashboard. I created my own API to get data from database using PHP.
    Fuel Tracker Logo Project
    Fuel Tracker - 2022-05 -19
    Tech Stack | React Native , Firebase , Google API , Google Sign In
    This is a mobile application project that can use to track location which fuel is available in Sri Lanka. The success of the project depends on the people. That means if you know that there is oil in a place, go to the app and update it and let others know about the relevant place. This is also not a plays tore like the “Dansala” app. No Dollars and some of the services running on this are free so there may be minor limitations. Premium packages are around $ 100, $ 200. It’s not possible to put that much into these projects at the moment. Me also plan to improve this in future.
    DOWNLOAD APP
    Project Dansala Logo
    Dansala - 2022-05 -14
    Tech Stack | React Native , Laravel API , Google API , Google Sign In
    “Dansal” are temporary alms stalls that distribute free food and drink to all during the Vesak festival. Across Sri Lanka these stalls will crop up, as families, corporations and even villages gather to set up “Dansal”, in remembrance of the Buddha’s teachings of benevolence and letting go of worldly desire.
    You can find and upload your ‘Dansala’ to this system using the app. And using this mobile application anyone can find the ‘Dansal’ in your area.
    DOWNLOAD APP
    Equizy App Logo Projects
    Equizy - 2022-05 -19
    Tech Stack | React Native , Firebase , Google API , Google Sign In
    The questionnaires created using EQuizy Web application (Link) are in the form of interactive tests quizzes that may contain pictures and sounds with automatic scoring. Thus, you can create your own quiz, play it and share it for self-evaluation or even for entertainment. Then student can download the mobile application and can play.
    After the quiz, the admin can see the results, the user (student) as well as the results of those who joined the quiz. (android app is available and IOS version is coming soon)

`;

const generateCoverLetter = async (job_data) => {
    const model = genAI.getGenerativeModel({ model: "gemini-pro" });
    const prompt = `Here is a job position that I would like to apply for. Do not put [] parameter to put to me. put it by yourself if needed, do not show them. do not add parameters to result.
    Job Description: ${job_data}. Considering the above job description and my skill sets below, create a professional cover letter.  
    No need to put receiver details. also do not add company details just start with dear Hr manager or something simillar. 
    only put my details on top of the letter. also my name is Udara Priyadarshana. +94779808015 is my contact number adn admin@udarax.me is my email.
    also do not forget to mention my site called https://udarax.me/projects/ to check my projects. 
    Include all my relevant data to the job description and highlight my related projects.
    Here are my skills and some other relevant CV data: ${cv_data}
    Here are some of my projects: ${project_data}. mention 2,3 projects at the end that matchs with the job description. also mention i attached my cv below.

    here is sample letter. so follow this format.

    Udara Liyanage
    Kalutara South, Sri Lanka
    +94 77 980 8015
    admin@udarax.me
    https://udarax.me
    June 12, 2024

    Dear Hiring Manager,

    I am writing to express my interest in the Software Developer position at Rajida. With a strong background in software development and a passion for coding, I am excited about the opportunity to join your dynamic team and contribute to both local and USA-based projects.

    I hold a Bachelor of Science in Computer Science from the University of Ruhuna, where I graduated with a GPA of 3.5/4.0. Over the past few years, I have gained extensive experience in software development, specializing in Java, which aligns perfectly with the requirements for this position. My technical expertise extends to several programming languages, including PHP, JavaScript, C, Python, and C++, and I am proficient with various frameworks such as Laravel, NextJs, ReactJs, Flask, and VueJs.

    In my current role as a Software Engineer at ITEK360, I have been responsible for designing, developing, and maintaining software applications. This role has enhanced my ability to write clean, efficient, and well-documented code while staying up to date with emerging trends in software development. My experience as a freelancer at UDARAX has further honed my skills in problem-solving and adapting to different working environments.

    Rajida's emphasis on excellent communication and teamwork abilities resonates with my professional experience. I have consistently demonstrated my ability to collaborate effectively with team members to deliver high-quality software solutions. My part-time role at Dewy Business Solutions allowed me to develop standalone Java applications, adding to my versatile technical portfolio.

    I am particularly excited about this opportunity at Rajida because of your commitment to fostering a collaborative and innovative work environment. I am confident that my background, skills, and enthusiasm for software development make me a strong candidate for this role. I am eager to contribute to your team's success and to continue developing my skills in a stimulating environment.

    Thank you for considering my application. I look forward to the possibility of discussing how my experience and vision align with the needs of Rajida. Please find my resume attached for your review. I am available at your earliest convenience for an interview and can be reached at +94 77 980 8015 or via email at admin@udarax.me.

    Sincerely,
    Udara Liyanage

    `;
    try {
        const result = await model.generateContent(prompt);
        const response = await result.response;
        const text = await response.text();
        return text;
    } catch (error) {
        console.error("Error generating cover letter:", error);
        throw new Error("Failed to generate cover letter");
    }
};

const send_email = async (to, html, key) => {

    let pdfAttachment = fs.readFileSync('Udara-Priyadarshana.pdf');
    let mailOptions = {
        from: `"Udara Liyanage" <${process.env.MAIL_FROM_ADDRESS}>`,
        to: [to, 'ldudaraliyanage@gmail.com'],
        subject: 'Job Application',
        html: html,
        attachments: [
            {
                filename: 'Udara Priyadarshana.pdf', 
                content: pdfAttachment,
            }
        ]
    };

    if (key == process.env.KEY) {
        transporter.sendMail(mailOptions, (error, info) => {
            if (error) {
                console.log(error);
                return 'Failed to send email';
            } else {
                console.log('Message sent: %s', info.messageId);
                return 'Email sent successfully';
            }
        });
    } else {
        return 'Invalid KEY';
    }
}

function formatText(text) {
    const htmlFormattedText = text.replace(/\n/g, '<br>');
    const htmlResponse = `<p>${htmlFormattedText}</p>`;
    return htmlResponse;
}