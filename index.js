const Discord = require('discord.js');
const axios = require('axios');
const fs = require('fs');
const https = require('https');
const config = require('./config.json');
const api = require('./api.json');
const apodUrl = 'https://api.nasa.gov/planetary/apod';
const DISCORD_CHANNEL_ID = '1049688666370490438';

// Create a new Discord client
const client = new Discord.Client({ intents: ["GUILDS", "GUILD_MESSAGES"] })


// When the bot is ready, log a message to the console

client.on('ready', () => {
    console.log(`Logged in as ${client.user.tag}!`);

    // Set a timer to send the APOD every 5 minutes
    setInterval(sendApod, 1440 * 60 * 1000);
});

async function sendApod() {
    try {
        const response = await axios.get(
            `https://api.nasa.gov/planetary/apod?api_key=${api.NASA_API_KEY}`
        );

        // Create a Discord message embed with the APOD data
        const embed = new Discord.MessageEmbed()
            .setTitle(response.data.title)
            .setImage(response.data.url)
            .setDescription(response.data.explanation);

        // Send the message to the desired Discord channel
        const channel = client.channels.cache.get(DISCORD_CHANNEL_ID);
        channel.send({ embeds: [embed] });
    } catch (error) {
        console.error(error);
    }
}



// When the bot receives a message, check for commands
client.on('message', msg => {

     if (msg.content === '!iss') {
        // If the message is '!iss', fetch the current location of the International Space Station
        axios.get('http://api.open-notify.org/iss-now.json').then(response => {
            // Send the coordinates of the International Space Station to the channel
            msg.channel.send(`The International Space Station is currently at: ${response.data.iss_position.latitude}, ${response.data.iss_position.longitude}`);
        }).catch(error => {
            // If there is an error, log it to the console
            console.error

        });
    }
});

client.on('message', msg => {
    // Ignore messages that aren't from a server or don't start with the prefix
    if (!msg.guild || !msg.content.startsWith('!exoplanet')) return;

    // Split the message into arguments
    const args = msg.content.split(' ');

    // Remove the command from the arguments
    args.shift();

    // Join the remaining arguments into a single search query
    const query = args.join(' ');

    // Make a request to the NASA Exoplanet API
    axios.get('https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI', {
        params: {
            table: 'exoplanets',
            format: 'json',
            select: 'pl_hostname,pl_name,pl_letter,pl_discmethod,pl_orbsmax',
            search: query,
            api_key: (api.NASA_API_KEY)
        }

    }).then(response => {
        console.log(response);
        // Check if there are any results
        if (response.data.count === 0) {
            msg.channel.send('No exoplanets were found matching your search query.');
            return;
        }

        // Create an embed with the exoplanet data
        const embed = new Discord.MessageEmbed()
            .setTitle(`Exoplanet Search Results for "${query}"`)
            .setColor(0x00AE86);

        // Add a field for each exoplanet
        response.data.results.forEach(exoplanet => {
            let fieldValue = `Host Star: ${exoplanet.pl_hostname}\n`;
            fieldValue += `Name: ${exoplanet.pl_name} ${exoplanet.pl_letter}\n`;
            fieldValue += `Discovery Method: ${exoplanet.pl_discmethod}\n`;
            fieldValue += `Maximum Orbital Distance: ${exoplanet.pl_orbsmax} AU`;
            embed.addField(exoplanet.pl_hostname, fieldValue);
        });

        // Send the embed to the channel
        msg.channel.send(embed);
    }).catch(error => {
        console.error(error);
        msg.channel.send('There was an error while searching for exoplanets.');
    });
    axios.get('https://exoplanetarchive.ipac.caltech.edu/cgi-bin/nstedAPI/nph-nstedAPI', {
        // ...
    }).then(response => {
        console.log(response);
        // ...
    });

});

client.on('message', async (message) => {
    if (message.content.startsWith('!apod')) {
        // Get the date from the user's message, or use today's date if no date is provided
        const date = message.content.split(' ')[1] || new Date().toISOString().slice(0, 10);

        try {
            const response = await axios.get(
                `https://api.nasa.gov/planetary/apod?api_key=${api.NASA_API_KEY}&date=${date}`
            );

            // Create a Discord message embed with the APOD data
            const embed2 = new Discord.MessageEmbed()
                .setTitle(response.data.title)
                .setImage(response.data.url)
                .setDescription(response.data.explanation);

            channel.send({ embeds: [embed2] });
        } catch (error) {
            console.error(error);
            message.channel.send('Sorry, there was an error fetching the APOD.');
        }
    }
});


client.on('message', async (message) => {
    if (message.content.startsWith('!moons')) {
        const planetName = message.content.split(' ')[1]; // get the planet name from the user's message

        try {
            const response = await axios.get(
                `https://api.le-systeme-solaire.net/rest/bodies/${planetName}/moons`
            );

            const moons = response.data.moons; // use the moons property of the response data
            const moonList = moons
                .map((moon) => moon.moon) // use the moon property instead of the name property
                .join(', '); // create a list of the moons' names

            message.channel.send(`${planetName} has the following moons: ${moonList}.`);
        } catch (error) {
            console.error(error);
            message.channel.send('Sorry, there was an error fetching information about that planet.');
        }
    }
});


client.on('message', async (message) => {
    if (message.content.startsWith('!moondata')) {
        const [, moonName] = message.content.split(' '); // get the moon name from the user's message

        try {
            const response = await axios.get(
                `https://api.le-systeme-solaire.net/rest/bodies/${moonName}`
            );

            const moon = response.data; // the response data contains information about the moon
            const moonInfo = `Name: ${moon.englishName}\nParent body: ${moon.aroundPlanet.planet}\nGravity: ${moon.gravity}\nDiscoverer: ${moon.discoveredBy}\nDiscovery date: ${moon.discoveryDate}`;

            message.channel.send(moonInfo);
        } catch (error) {
            console.error(error);
            message.channel.send('Sorry, there was an error fetching information about that moon.');
        }
    }
});







// Log the bot in using the token
client.login(config.token);