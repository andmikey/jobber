class Pager {
    constructor (id) {
        this.id = id;
        this.node = document.getElementById(this.id);
        this.pages = document.getElementsByClassName("page");
        
        this.scroller = document.getElementById("survey-scroller");
        
        this.prev = this.node.getElementsByClassName("prev")[0];
        this.prev.addEventListener("click", this.prevPage.bind(this));
        this.next = this.node.getElementsByClassName("next")[0];
        this.next.addEventListener("click", this.nextPage.bind(this));

        this.submit = document.getElementById("survey-submitter");

        this.setPage(0);
    }

    setPage (index) {
        if (this.index != undefined) {
            this.pages[this.index].classList.remove("showing");
        }
        if (this.index == index) return;

        this.index = index;

        this.pages[this.index].classList.add("showing");

        this.prev.style.display = null;
        this.next.style.display = null;
        this.submit.style.display = "none";
        this.prev.innerHTML = "Prev Section";
        this.next.innerHTML = "Next Section";
        if (this.index === 0) {
            this.prev.style.display = "none";
            this.next.innerHTML = "Start the Survey";
        } else if (this.index === this.pages.length - 1) {
            this.next.style.display = "none";
            this.submit.style.display = null;
        }
        
        // scroll the form back to the top
        this.scroller.scrollTop = 0;
    }

    nextPage () {
        if (this.index === this.pages.length - 1) return;
        this.setPage(this.index + 1);
    }
    prevPage () {
        if (this.index === 0) return;
        this.setPage(this.index - 1);
    }
}

class Form {
    constructor (id, questions, setPage) {
        this.id = id;
        this.questions = questions;
        this.setPage = setPage;
        
        this.node = document.getElementById(this.id);
    }

    submit () {
        var validities = this.questions.map(q => q.showAdvice());
        var allValid = validities.every(x => x == true);
        if (!allValid) {
            var index = Math.floor(validities.indexOf(true) / 2);
            this.setPage(index);
        }
    }
}

class Question {
    constructor (id, text) {
        this.id = id;
        this.node = document.getElementById(this.id);
        this.node.classList.add("form-group");
        
        var label = document.createElement("label");
        label.innerHTML = text;
        this.node.appendChild(label);
        
        this.answer = document.createElement("div");
        this.answer.className = "answer";
        this.node.appendChild(this.answer);

        var adviceEls = this.node.getElementsByClassName("advice");
        if (adviceEls == undefined) this.adviceEl = {}
        else this.adviceEls = adviceEls[0];
    }
    get isValid () {
        return true;
    }
    errorMessage = "";
    showAdvice () {
        var isValid = this.isValid;
        if (isValid) {
            this.adviceEl.style.display = null;
            this.adviceEl.innerHTML = this.advice;
        } else {
            this.adviceEl.style.display = "none";
            this.adviceEl.innerHTML = "";
        }
        return isValid;
    }
}

class Integer extends Question {
    constructor (id, text, max, min) {
        super(...arguments);
        var input = document.createElement("input");
        input.className = "form-control";
        input.type = "number";
        input.placeholder = "Input a number from 1 to 100.";
        input.max = max ? max : 100;
        input.min = min ? min : 1;

        this.answer.appendChild(input);
    }
}

class Checklist extends Question {
    constructor (id, text, inputs, radio, unmodifiable) {
        super(...arguments);
        this.type = radio ? "radio" : "checkbox";

        // If radio mode is set, use same name for all boxes
        for (var input of inputs) {
            var name = input[0]; 
            var text = input[1];
            var c = this.createCheckbox(name, text);
            this.answer.appendChild(c);
        }

        if (unmodifiable !== true) {
            var addButton = document.createElement("div");
            addButton.innerHTML = "Don't see your option? Click to add another.";
            addButton.className = "btn btn-themed btn-sm mt-2 w-100 border-0";
            addButton.addEventListener("click", this.newCustomInput.bind(this));
            this.addButton = addButton;
            this.answer.appendChild(addButton);
        }
    }
    removeChild (child) {
        this.answer.removeChild(child);
    }
    createCheckbox (name, text, checkbox, textNode) {
        var container = document.createElement("div");
        container.className = "form-check btn btn-light";

        if (textNode == undefined && checkbox == undefined) {
            checkbox = document.createElement("input");
            if (this.type === "radio") {
                checkbox.name = this.id;
                checkbox.value = name;
            } else {
                checkbox.name = name;
            }
            checkbox.type = this.type;
            checkbox.checked = false;

            container.addEventListener("click", function () {
                checkbox.checked = !checkbox.checked;
            });
            
            textNode = document.createTextNode(" " + text);
        }
        
        container.appendChild(checkbox);
        container.appendChild(textNode);
        return container;
    }
    newCustomInput () {
        var remove = document.createElement("div");
        remove.className = "remove btn btn-outline-danger";
        remove.innerHTML = "&times;";
        remove.style.paddingLeft = "1px";

        var input = document.createElement("input");
        input.type = "text";
        input.className = "form-control form-control-sm";
        input.placeholder = "Enter new option here...";

        var container = this.createCheckbox("", "", remove, input);
        container.classList.add("d-flex", "align-items-center");
        remove.addEventListener("click", this.removeChild.bind(this, container));

        this.answer.insertBefore(container, this.addButton);

        input.focus();
    }
}

var pager = new Pager("survey-body");

new Form("survey", [
    ,new   Integer("simultaneous-applications"
                  ,"When searching for a job, roughly how many separate job applications do you tend to manage at any one time?"
                  )
    ,new Checklist("how-tracking"
                  ,"How do you normally keep track of your applications and their documents as you apply to them?"
                  ,[["docs", "Word Documents / Typed Up Files (.doc, .txt, .etc)"]
                   ,["spread", "Spreadsheets (Excel, Gnumeric, etc.)"]
                   ,["paper", "Pen and Paper (Notebook, Post-Its, etc.)"]
                   ]
                  )
    ,new Checklist("extra-documents"
                  ,"What documents have been requested from you in past applications, aside from CVs?"
                  ,[["cover", "Cover Letter"]
                   ,["reference", "Letter of Reference / Recommendation"]
                   ,["philosophy", "Work Philosophy"]
                   ]
                  )
    ,new Checklist("document-creation-softwares"
                  ,"What programs or softwares do you use to create documents for applications?"
                  ,[["word", "Word / Google Docs / Other Office Suite Software"]
                   ,["latex", "LaTeX"]
                   ,["indesign", "InDesign / GIMP / Other Design and Artwork Software"]
                   ]
                  )
    ,new   Integer("different-cvs"
                  ,"How many different CVs do you generally maintain at a given time?"
                  )
    ,new Checklist("update-frequency"
                  ,"How often do you update or change your CV's contents or layout?<br/><small class='text-muted text-normal'>(Pick the first that applies.)</small>"
                  ,[["job", "For every job application"]
                   ,["skill", "Every time I acquire a new skill"]
                   ,[">1pmo", "More than once a month"]
                   ,[">3pmo", "More than once every 3 months"]
                   ,[">1pyr", "More than once a year"]
                   ,["<1pyr", "Less than once a year"]
                   ]
                  ,true,true)
    ], pager.setPage.bind(pager));