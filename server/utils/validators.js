
// Email Validation using Regular Expression
const validateEmail = (email) => {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;

    return emailRegex.test(email);
};

// Domain Validation using Regular Expression
const validateDomain = (domain) => {
    const domainRegex = /^(?!-)[a-zA-Z0-9-]+(?<!-)(\.[a-zA-Z]{2,})+$/;

    return domainRegex.test(domain);
};

// DFA-based Email Validation
const validateEmailDFA = (email) => {
    let state = 0;

    for (const char of email) {
        switch (state) {
            case 0:
                if (/[a-zA-Z0-9._%+-]/.test(char)) {
                    state = 1;
                } else {
                    return false;
                }
                break;

            case 1:
                if (/[a-zA-Z0-9._%+-]/.test(char)) {
                    state = 1;
                } else if (char === "@") {
                    state = 2;
                } else {
                    return false;
                }
                break;

            case 2:
                if (/[a-zA-Z0-9-]/.test(char)) {
                    state = 3;
                } else {
                    return false;
                }
                break;

            case 3:
                if (/[a-zA-Z0-9-]/.test(char)) {
                    state = 3;
                } else if (char === ".") {
                    state = 4;
                } else {
                    return false;
                }
                break;

            case 4:
                if (/[a-zA-Z]/.test(char)) {
                    state = 5;
                } else {
                    return false;
                }
                break;

            case 5:
                if (/[a-zA-Z]/.test(char)) {
                    state = 5;
                } else if (char === ".") {
                    state = 4;
                } else {
                    return false;
                }
                break;
        }
    }

    return state === 5;
};

// Export Functions
module.exports = {
    validateEmail,
    validateDomain,
    validateEmailDFA
};
