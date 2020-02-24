// ==UserScript==
// @name         UQ course list expander
// @namespace    http://tampermonkey.net/
// @version      0.1
// @description  try to take over the world!
// @author       You
// @match        https://my.uq.edu.au/programs-courses/plan_display.html?acad_plan=*
// @grant        none
// ==/UserScript==

(() => {
    const selectors = {
        header: 'thead tr',
        courselist: '.courselist table',
        course: 'tbody > tr',
        summary: '#summary [id^=course]',
        description: '#description .course-offering-year',
    };
    const parser = new DOMParser();

    const scrapeCourseData = (dom) => {
        const summary = Array.from(dom.querySelectorAll(selectors.summary))
            .reduce((summary, el) => {
                summary[el.id.replace(/course-/, '')] = el.innerText.trim();
                return summary;
            }, {});
        
        const archivedOfferings = Array.from(dom.querySelectorAll(selectors.description))
            .map((offering) => offering.innerText.trim());
        
        summary.semesters = Array.from(archivedOfferings.reduce((set, offering) => 
            set.add(offering.replace(/,\s\d{4}/, '')), new Set()));
        
        return {summary, offerings: archivedOfferings};
    };

    const appendCell = (row, callback) => {
        const td = document.createElement('td');
        row.appendChild(td);
        callback.then((data) => td.innerText = data);
    }

    const fetchData = async (code, url) => {
        const response = await fetch(url);
        const text = await response.text();
        const dom = parser.parseFromString(text, 'text/html');
        const data = {
            code,
            ...scrapeCourseData(dom),
        };
        console.log(data);
        return data;
    }

    const appendData = (row, dataPromise) => {
        appendCell(row, dataPromise.then((data) => data.summary.prerequisite || ''));
        appendCell(row, dataPromise.then((data) => data.summary.semesters.map((sem) => sem.replace(/Semester|\s/g, '')).join(', ')));
    };

    const applyToRow = async (row) => {
        if (row.className.includes('or')) {
            row.querySelector('td').colSpan += 2;
            return; 
        }

        const link = row.querySelector('a');
        const url = link.href
        const code = link.innerText
        if (!url) {
            console.log('no data found for course', code);
            return;
        }
        
        appendData(row, fetchData(code, url));
    };

    const appendHeaders = (table) => {
        const header = table.querySelector(selectors.header);
        appendCell(header, Promise.resolve('Prerequisite'));
        appendCell(header, Promise.resolve('Semesters'));

        return table;
    };

    const scrapePage = () => {
        Array.from(document.querySelectorAll(selectors.courselist))
            .forEach((courselist) =>
                Array.from(appendHeaders(courselist)
                    .querySelectorAll(selectors.course))
                    .forEach((course) => applyToRow(course)));

    };

    scrapePage();
})();