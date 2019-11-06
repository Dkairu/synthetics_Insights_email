// Use this script to automate emailing dashboards from insights. You will need a New Relic login for the account you want to email dashboards from.


/** CONFIGURATIONS **/
NRLogin = 'New Relic Username';
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
/** END OF CONFIGURATION **/

// Theshold for duration of entire script - fails test if script lasts longer than X (in ms)
var ScriptTimeout = 180000;
// Script-wide timeout for all wait and waitAndFind functions (in ms)
var DefaultTimeout = 30000;
// Change to any User Agent you want to use.
// Leave as "default" or empty to use the Synthetics default.
var UserAgent = "default";

/** HELPER VARIABLES AND FUNCTIONS**/

var assert = require('assert'),
	By = $driver.By,
	browser = $browser.manage(),
	startTime = Date.now(),
	stepStartTime = Date.now(),
	prevMsg = '',
	prevStep = 0,
	lastStep = 9999,
	VARS = {};

var fs = require('fs');
var nodemailer = require('nodemailer');
var transporter = nodemailer.createTransport(emailSettings);
var imgPath = "/tmp/test.png";
var PDFurl;
var mailOptions = function({
	sender = '', recipients = '', subject = '', insightsURL = '', imgPath = ''
}) {
	return {
		from: `${sender}`,
		to: `${recipients}`,
		subject: `${subject}`,
		html: `<a href="${insightsURL}"><b>Click here to see the PDF of this New Relic Dashboard!</b><br><br><img src="cid:insightsImage"/></a>`,
		attachments: [{
			path: imgPath,
			cid: 'insightsImage'
		}]
	};
};
var log = function(thisStep, thisMsg) {
	if (thisStep > 1 || thisStep == lastStep) {
		var totalTimeElapsed = Date.now() - startTime;
		var prevStepTimeElapsed = Date.now() - (startTime + stepStartTime);
		console.log('Step ' + prevStep + ': ' + prevMsg + ' FINISHED. It took ' + prevStepTimeElapsed + 'ms to complete.');
		$util.insights.set('Step ' + prevStep + ': ' + prevMsg, prevStepTimeElapsed);
		if (ScriptTimeout > 0 && totalTimeElapsed > ScriptTimeout) {
			throw new Error('Script timed out. ' + totalTimeElapsed + 'ms is longer than script timeout threshold of ' + ScriptTimeout + 'ms.');
		}
	}
	if (thisStep > 0 && thisStep != lastStep) {
		stepStartTime = Date.now() - startTime;
		console.log('Step ' + thisStep + ': ' + thisMsg + ' STARTED at ' + stepStartTime + 'ms.');
		prevMsg = thisMsg;
		prevStep = thisStep;
	}
};

//This function is called when a screenshot is taken of the full screen, and it saves the screenshot as a png file
function writeScreenshot(data) {
	var png_file = new Buffer(data, 'base64');
	fs.writeFile(imgPath, png_file, function(err) {
		if (err) console.log(err);
	});
}


/** BEGINNING OF SCRIPT **/

console.log('Starting synthetics script: {Untitled Test Case}');
console.log('Default timeout is set to ' + (DefaultTimeout / 1000) + ' seconds');

// Setting User Agent is not then-able, so we do this first (if defined and not default)
if (UserAgent && (0 !== UserAgent.trim().length) && (UserAgent != 'default')) {
	$browser.addHeader('User-Agent', UserAgent);
	console.log('Setting User-Agent to ' + UserAgent);
}

// Get browser capabilities and do nothing with it, so that we start with a then-able command
$browser.getCapabilities().then(function() {})
	.then(function() {
		log(1, 'Open the New Relic Login Page');
		return $browser.get("https://login.newrelic.com/login?return_to=https%3A%2F%2Fone.newrelic.com%2F");
	})

.then(function() {
		log(2, 'Click on the login form');
		return $browser.waitForAndFindElement(By.id("login"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
	})
	.then(function() {
		log(3, 'Type user name');
		return $browser.waitForAndFindElement(By.id("login_email"), DefaultTimeout);
	})
	.then(function(el) {
		el.sendKeys(NRLogin);
	})
	.then(function() {
		log(4, 'Type password');
		return $browser.waitForAndFindElement(By.id("login_password"), DefaultTimeout);
	})
	.then(function(el) {
		el.sendKeys(NRPass);
	})
	.then(function() {
		log(5, 'Login to NR ONE');
		return $browser.waitForAndFindElement(By.id("login_submit"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
	})
	.then(function() {
		log(6, 'Go to Dashboards');
		return $browser.waitForAndFindElement(By.css(".nr1-LauncherCard:nth-child(3) .nr1-LauncherLogo"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
	})
	.then(function() {
		log(7, 'Search for the required dashboard');
		return $browser.waitForAndFindElement(By.css("input:nth-child(1)"), DefaultTimeout);
	})
	.then(function(el) {
		el.sendKeys(Dashboard);
	})
	.then(function() {
		log(8, 'Searching');
		return $browser.waitForAndFindElement(By.css("input:nth-child(1)"), DefaultTimeout);
	})
	.then(function(el) {
		el.sendKeys($driver.Key.ENTER);
	})
	.then(function() {
		log(9, 'Click to open the first dashboard');
		return $browser.waitForAndFindElement(By.css(".NameCell-name"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
	})
	.then(function() {
		log(10, 'Click on PDF download');
		$browser.sleep(3000);
		return $browser.waitForAndFindElement(By.xpath("//div[contains(@class,'HeaderControl-trigger')][1]/button"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
	})
	.then(function() {
		log(11, 'Wait for the Gorgon PDF page to fully load then switch to that tab and grab the URL then switch back to NR1');
		$browser.sleep(3000);
		return $browser.getAllWindowHandles().then(function(handles) {
			$browser.switchTo().window(handles[1]);
			$browser.getCurrentUrl().then(function(pdfurl) {
				PDFurl = pdfurl;
			});
			$browser.switchTo().window(handles[0]);
		});
	})
	.then(function() {
		log(12, 'Click on full screen and take a screenshot');
		return $browser.waitForAndFindElement(By.xpath("//div[contains(@class,'HeaderControl-trigger')][5]/button"), DefaultTimeout);
	})
	.then(function(el) {
		el.click();
		$browser.constructor.prototype.takeScreenshot.call($browser)
			.then(function(data) {
				writeScreenshot(data);
			});
	})
	.then(function() {
		log(13, 'Collect the PDF URL and screeenshot and send email');
		let options = mailOptions({
			sender: Sender,
			recipients: Recipients,
			subject: Subject,
			insightsURL: PDFurl,
			imgPath: imgPath
		});
		return transporter.sendMail(options, function(error, info) {
			if (error) {
				return console.log(error);
			}
			console.log('Message sent: ' + info.response);
		});
	})


.then(function() {
	log(lastStep, '');
	console.log('Browser script execution SUCCEEDED.');
}, function(err) {
	console.log('Browser script execution FAILED.');
	throw (err);
});