/**
    {
        "api":1,
        "name":"Timestamp to Date",
        "description":"Converts Unix timestamp to human-readable date (UTC and Local)",
        "author":"Claude",
        "icon":"watch",
        "tags":"date,time,calendar,unix,timestamp"
    }
**/

function main(input) {
    let timestamp = input.text.trim();

    // Parse the timestamp
    let timestampNum = parseInt(timestamp);

    if (isNaN(timestampNum)) {
        input.postError("Invalid timestamp");
        return;
    }

    // Create Date object (multiply by 1000 to convert seconds to milliseconds)
    let date = new Date(timestampNum * 1000);

    if (isNaN(date.getTime())) {
        input.postError("Invalid timestamp");
        return;
    }

    // Format UTC time
    const utcOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        timeZone: 'UTC',
        hour12: true
    };
    const utcFormatted = date.toLocaleString('en-US', utcOptions);

    // Format local time
    const localOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        second: '2-digit',
        hour12: true
    };
    const localFormatted = date.toLocaleString('en-US', localOptions);

    // Get timezone offset
    const timezoneOffset = -date.getTimezoneOffset();
    const offsetHours = Math.floor(Math.abs(timezoneOffset) / 60);
    const offsetMinutes = Math.abs(timezoneOffset) % 60;
    const offsetSign = timezoneOffset >= 0 ? '+' : '-';
    const timezoneString = `GMT${offsetSign}${String(offsetHours).padStart(2, '0')}:${String(offsetMinutes).padStart(2, '0')}`;

    // Build output
    const output = `GMT: ${utcFormatted}\nYour time zone: ${localFormatted} [${timezoneString}]`;

    input.text = output;
}
