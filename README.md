Use this synthetics script to email Insights Dashboards with PDF links to stake holders. Just copy the code in scriptedbrowser.js into your scripted browser script editor and copy the package.json file to a location where you can call when running cpm.

The script uses a 3rd party module nodemailer to send the emails and requires you to run it in CPM. You will have to create a package.json file with it as a dependency and call it when running the CPM container.

```
docker run \
--name YOUR_CONTAINER_NAME \
-e "MINION_PRIVATE_LOCATION_KEY=YOUR_PRIVATE_LOCATION_KEY" \
-v /tmp:/tmp:rw \
-v /var/run/docker.sock:/var/run/docker.sock:rw \
-v /location of package.json:/var/lib/newrelic/synthetics/modules:rw \
quay.io/newrelic/synthetics-minion:latest
```
Easy enough to get it started all you need before running it is filling out these details.
```
NRPass = 'New Relic Password';
Dashboard = 'Enter dashboard # or unique name';
Sender = 'Email you want to appear as the sender';
Recipients = 'Email or emails of receipients separated by a comma';
Subject = 'Subject of the email';

emailSettings = {
    service: 'Gmail',
    auth: {
        user: 'EMAIL_ADDRESS',
        pass: 'EMAIL_PASSWORD'
    }
};
```
To provide a weekly or monthly report you can use the downtime feature in synthetics to setup accordingly.

Please note if you will be using gmail to send out the reports, you will also need to change the security access settings to allow 3rd party access. 
