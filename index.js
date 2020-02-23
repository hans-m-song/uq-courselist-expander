(() => {
    const selectors = {
        courselist: '.courselist',
        course: 'tbody > tr:not(.option.or)',
        summary: '#summary [id^=course]',
        description: '#description .course-offering-year',
    };

    const scrapeCourseData = (document) => {
        const summary = Array.from(document.querySelectorAll(selectors.summary))
            .reduce((summary, el) => {
                summary[el.id.replace(/course-/, '')] = el.innerText;
                return summary;
            }, {});
        
        const archivedOfferings = Array.from(document.querySelectorAll(selectors.description))
            .map((offering) => offering.innerText.trim());
        
        summary.semesters = Array.from(archivedOfferings.reduce((set, offering) => 
            set.add(offering.replace(/,\s\d{4}/, '')), new Set()));
        
        return {summary, offerings: archivedOfferings};
    };

    const applyToRow = async (parser, row) => {
        const link = row.querySelector('a');
        const response = await fetch(link);
        const text = await response.text();
        const dom = parser.parseFromString(text, 'text/html');
        const data = scrapeCourseData(dom);
        console.log(data);
    };

    const scrapePage = () => {
        const parser = new DOMParser();
        Array.from(document.querySelectorAll(selectors.courselist))
            .forEach((courselist) =>
                Array.from(courselist.querySelectorAll(selectors.course))
                    .forEach((course) => applyToRow(parser, course)));

    };

    scrapePage();
})()