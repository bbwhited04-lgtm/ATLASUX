module.exports.runtime = {
  handler: async function ({ title, date, time, duration, description, location }) {
    const callerId = `${this.config.name}-v${this.config.version}`;
    try {
      this.introspect(
        `${callerId} called to generate calendar event links`
      );

      const [year, month, day] = date.split('-').map(Number);
      const [hours, minutes] = time.split(':').map(Number);
      const startDate = new Date(year, month - 1, day, hours, minutes, 0);
      const endDate = new Date(startDate.getTime() + duration * 60000);

      // Format for Google Calendar (needs timezone offset)
      const tzOffset = startDate.getTimezoneOffset();
      const tzOffsetHours = Math.abs(Math.floor(tzOffset / 60)).toString().padStart(2, '0');
      const tzOffsetMinutes = (Math.abs(tzOffset) % 60).toString().padStart(2, '0');
      const tzString = (tzOffset <= 0 ? '+' : '-') + tzOffsetHours + tzOffsetMinutes;

      // Format dates for Google Calendar
      const formatToGoogleDate = (date) => {
        return date.getFullYear() +
          (date.getMonth() + 1).toString().padStart(2, '0') +
          date.getDate().toString().padStart(2, '0') + 'T' +
          date.getHours().toString().padStart(2, '0') +
          date.getMinutes().toString().padStart(2, '0') +
          '00' + tzString;
      };

      const googleDates = `${formatToGoogleDate(startDate)}/${formatToGoogleDate(endDate)}`;

      // Format dates for Outlook (local timezone)
      const formatToOutlookDate = (date) => {
        return date.getFullYear() + '-' +
          (date.getMonth() + 1).toString().padStart(2, '0') + '-' +
          date.getDate().toString().padStart(2, '0') + 'T' +
          date.getHours().toString().padStart(2, '0') + ':' +
          date.getMinutes().toString().padStart(2, '0') + ':00' +
          tzString.replace(':', '');
      };

      const outlookStart = formatToOutlookDate(startDate);
      const outlookEnd = formatToOutlookDate(endDate);

      const encodedTitle = encodeURIComponent(title);
      const encodedDescription = encodeURIComponent(description);
      const encodedLocation = encodeURIComponent(location);

      const googleUrl = `https://calendar.google.com/calendar/u/0/r/eventedit?text=${encodedTitle}&dates=${googleDates}&details=${encodedDescription}&location=${encodedLocation}`;
      const outlookUrl = `https://outlook.live.com/calendar/0/deeplink/compose?subject=${encodedTitle}&startdt=${outlookStart}&enddt=${outlookEnd}&body=${encodedDescription}&location=${encodedLocation}`;

      return JSON.stringify({
        title,
        startTime: startDate.toLocaleString(),
        endTime: endDate.toLocaleString(),
        duration,
        description,
        location,
        googleCalendarUrl: googleUrl,
        outlookCalendarUrl: outlookUrl
      });

    } catch (e) {
      this.introspect(
        `${callerId} failed to generate calendar links. Reason: ${e.message}`
      );
      this.logger(
        `${callerId} failed to generate calendar links`,
        e.message
      );
      return `Failed to generate calendar event links. Error: ${e.message}`;
    }
  }
};
