const languages = [
{
    code: "es",
    displayName: "Español",
    fileName: "bienvenida_usuario.py",
    funcKeyword: "definir",
    funcName: "bienvenida_usuario",
    paramName: "nombre",
    typeHint: "cad",
    docstring: "Esta función da la bienvenida al usuario por su nombre. Si no se proporciona el nombre del usuario, la función pedirá al usuario su nombre.",
    comment1: "# Preguntar al usuario su nombre",
    inputFunc: "entrada",
    promptText: "¿Cómo te llamas? ",
    comment2: "# Imprimir mensaje de bienvenida",
    printKeyword: "imprimir",
    fString: "f",
    welcomePrefix: "¡Hola, ",
    welcomeSuffix: "! ¡Bienvenido a Legesher!",
    comment3: "# Devolver el nombre del usuario",
    returnKeyword: "devolver",
    returnVar: "nombre",
    nameValue: "Peggy",
    userName: "nombreUsuario"
},
{
    code: "zh",
    displayName: "中文",
    fileName: "欢迎用户.py",
    funcKeyword: "定义",
    funcName: "欢迎用户",
    paramName: "名字",
    typeHint: "字符串",
    docstring: "此函数通过名字欢迎用户。如果未提供用户名字，函数将询问用户的名字。",
    comment1: "# 询问用户的名字",
    inputFunc: "输入",
    promptText: "你叫什么名字？",
    comment2: "# 打印欢迎信息",
    printKeyword: "打印",
    fString: "格",
    welcomePrefix: "你好，",
    welcomeSuffix: "！欢迎来到Legesher！",
    comment3: "# 返回用户的名字",
    returnKeyword: "返回",
    returnVar: "名字",
    nameValue: "佩吉",
    userName: "用户名"
},
{
    code: "ar",
    displayName: "العربية",
    fileName: "ترحيب_المستخدم.py",
    funcKeyword: "عرّف",
    funcName: "ترحيب_المستخدم",
    paramName: "الاسم",
    typeHint: "نص",
    docstring: "هذه الدالة ترحب بالمستخدم باسمه. إذا لم يتم تقديم اسم المستخدم، ستطلب الدالة من المستخدم إدخال اسمه.",
    comment1: "# اسأل المستخدم عن اسمه",
    inputFunc: "إدخال",
    promptText: "ما هو اسمك؟ ",
    comment2: "# اطبع رسالة الترحيب",
    printKeyword: "اطبع",
    fString: "ت",
    welcomePrefix: "مرحباً، ",
    welcomeSuffix: "! أهلاً بك في Legesher!",
    comment3: "# أرجع اسم المستخدم",
    returnKeyword: "أرجع",
    returnVar: "الاسم",
    nameValue: "بيغي",
    userName: "اسم_المستخدم"
},
{
    code: "en",
    displayName: "English",
    fileName: "welcome_user.py",
    funcKeyword: "def",
    funcName: "welcome_user",
    paramName: "name",
    typeHint: "str",
    docstring: "This function welcomes the user by name. If the user's name is not provided, the function will ask the user for their name.",
    comment1: "# Ask the user for their name",
    inputFunc: "input",
    promptText: "What's your name? ",
    comment2: "# Print a welcome message",
    printKeyword: "print",
    fString: "f",
    welcomePrefix: "Hello, ",
    welcomeSuffix: "! Welcome to Legesher!",
    comment3: "# Return the user's name",
    returnKeyword: "return",
    returnVar: "name",
    nameValue: "Peggy",
    userName: "userName"
}
];

/**
 * Represents the UI elements used in the code editor.
 * Each property corresponds to a specific part of the editor's interface.
 * @typedef {Object} Elements
 * @property {HTMLElement|null} languageIndicator - The element indicating the selected language.
 * @property {HTMLElement|null} fileName - The element displaying the file name.
 * @property {HTMLElement|null} funcKeyword - The element for the function keyword.
 * @property {HTMLElement|null} funcName - The element for the function name.
 * @property {HTMLElement|null} paramName - The element for the parameter name.
 * @property {HTMLElement|null} typeHint - The element for the type hint.
 * @property {HTMLElement|null} docstring - The element for the docstring.
 * @property {HTMLElement|null} docstringText - The element for the docstring text.
 * @property {HTMLElement|null} docstringEnd - The element for the end of the docstring.
 * @property {HTMLElement|null} comment1 - The element for the first comment.
 * @property {HTMLElement|null} inputFunc - The element for the input function.
 * @property {HTMLElement|null} promptText - The element for the prompt text.
 * @property {HTMLElement|null} comment2 - The element for the second comment.
 * @property {HTMLElement|null} printKeyword - The element for the print keyword.
 * @property {HTMLElement|null} fString - The element for the formatted string indicator.
 * @property {HTMLElement|null} welcomeText - The element for the welcome text.
 * @property {HTMLElement|null} comment3 - The element for the third comment.
 * @property {HTMLElement|null} returnKeyword - The element for the return keyword.
 * @property {HTMLElement|null} returnVar - The element for the return variable.
 * @property {HTMLElement|null} nameValue - The element for the name value.
 * @property {HTMLElement|null} printKeyword2 - The element for the second print keyword.
 * @property {HTMLElement|null} funcCall - The element for the function call.
 * @property {HTMLElement|null} varName - The element for the variable name.
 * @property {HTMLElement|null} usernameDeclaration - The element for the username declaration.
 * @property {HTMLElement|null} usernameArgument - The element for the username argument.
 * @property {HTMLElement|null} welcomePrefix - The element for the welcome prefix.
 * @property {HTMLElement|null} welcomeSuffix - The element for the welcome suffix.
 * @property {HTMLElement|null} fStringVar - The element for the formatted string variable.
 */
let elements = {
    languageIndicator: null,
    fileName: null,
    funcKeyword: null,
    funcName: null,
    paramName: null,
    typeHint: null,
    docstring: null,
    docstringText: null,
    docstringEnd: null,
    comment1: null,
    inputFunc: null,
    promptText: null,
    comment2: null,
    printKeyword: null,
    fString: null,
    welcomeText: null,
    comment3: null,
    returnKeyword: null,
    returnVar: null,
    nameValue: null,
    printKeyword2: null,
    funcCall: null,
    varName: null,
    usernameDeclaration: null,
    usernameArgument: null,
    welcomePrefix: null,
    welcomeSuffix: null,
    fStringVar: null
};

let currentIndex = 0;
let lastLangCode = languages[0].code;

function initializeElements() {
elements = {
    languageIndicator: document.getElementById('language-indicator'),
    fileName: document.getElementById('file-name'),
    funcKeyword: document.getElementById('func-keyword'),
    funcName: document.getElementById('func-name'),
    paramName: document.getElementById('param-name'),
    typeHint: document.getElementById('type-hint'),
    docstring: document.getElementById('docstring'),
    docstringText: document.getElementById('docstring-text'),
    docstringEnd: document.getElementById('docstring-end'),
    comment1: document.getElementById('comment'),
    inputFunc: document.getElementById('input-func'),
    promptText: document.getElementById('prompt-text'),
    comment2: document.getElementById('comment-2'),
    printKeyword: document.getElementById('print-keyword'),
    fString: document.getElementById('f-string'),
    welcomeText: document.getElementById('welcome-text'),
    comment3: document.getElementById('comment-3'),
    returnKeyword: document.getElementById('return-keyword'),
    returnVar: document.getElementById('return-var'),
    nameValue: document.getElementById('name-value'),
    printKeyword2: document.getElementById('print-keyword-2'),
    funcCall: document.getElementById('func-call'),
    varName: document.getElementById('var-name'),
    usernameDeclaration: document.getElementById('username-declaration'),
    usernameArgument: document.getElementById('username-argument'),
    welcomePrefix: document.getElementById('welcome-prefix'),
    welcomeSuffix: document.getElementById('welcome-suffix'),
    fStringVar: document.getElementById('f-string-var')
};
}

// Helper: get the current DOM state as a virtual object
function getCurrentDomState() {
const state = {};
Object.entries(elements).forEach(([key, el]) => {
    if (el) state[key] = el.textContent;
});
return state;
}

// Helper: get the virtual state for a language
function getVirtualState(lang) {
return {
    languageIndicator: lang.displayName,
    fileName: lang.fileName,
    funcKeyword: lang.funcKeyword,
    funcName: lang.funcName,
    paramName: lang.paramName,
    typeHint: lang.typeHint,
    docstringText: lang.docstring,
    comment1: lang.comment1,
    inputFunc: lang.inputFunc,
    promptText: lang.promptText,
    comment2: lang.comment2,
    printKeyword: lang.printKeyword,
    fString: lang.fString,
    welcomePrefix: lang.welcomePrefix,
    welcomeSuffix: lang.welcomeSuffix,
    comment3: lang.comment3,
    returnKeyword: lang.returnKeyword,
    returnVar: lang.returnVar,
    nameValue: lang.nameValue,
    printKeyword2: lang.printKeyword,
    funcCall: lang.funcName,
    varName: lang.paramName,
    usernameDeclaration: lang.userName,
    usernameArgument: lang.userName,
    fStringVar: lang.paramName,
};
}

function updateText() {
const lang = languages[currentIndex];
const virtualState = getVirtualState(lang);
const currentState = getCurrentDomState();

// Fade out only changed elements
Object.entries(elements).forEach(([key, el]) => {
    if (!el) return;
    if (virtualState[key] !== undefined && virtualState[key] !== currentState[key]) {
        el.classList.add('opacity-0');
        el.classList.remove('opacity-100');
    }
});

setTimeout(() => {
    // Update only changed elements and fade in
    Object.entries(elements).forEach(([key, el]) => {
    if (!el) return;
    if (virtualState[key] !== undefined && virtualState[key] !== currentState[key]) {
        el.textContent = virtualState[key];
        el.classList.remove('opacity-0');
        el.classList.add('opacity-100');
    }
    });

    // Only update RTL/LTR logic if the language changes
    if (lang.code !== lastLangCode) {
    if (elements.fileName) {
        const rtlFileName = document.getElementById('file-name-rtl');
        if (rtlFileName) rtlFileName.textContent = lang.fileName;

        if (lang.code === "ar") {
        elements.fileName.classList.add('direction-rtl');
        elements.fileName.classList.remove('direction-ltr');
        document.querySelectorAll('.code-editor-line').forEach(line => {
            line.setAttribute('dir', 'rtl');
        });
        document.querySelectorAll('.code-editor-element').forEach(el => {
            el.classList.add('direction-rtl');
            el.classList.remove('direction-ltr');
        });
        const ltrFileTab = document.querySelector('.ltr-file-tab');
        const rtlFileTab = document.querySelector('.rtl-file-tab');
        if (ltrFileTab) ltrFileTab.classList.add('hidden');
        if (rtlFileTab) rtlFileTab.classList.remove('hidden');
        const languageIndicator = document.querySelector('.code-editor-language-indicator');
        if (languageIndicator) {
            languageIndicator.classList.add('ml-0', 'mr-auto');
            languageIndicator.classList.remove('ml-auto', 'mr-0');
        }
        } else {
        elements.fileName.classList.add('direction-ltr');
        elements.fileName.classList.remove('direction-rtl');
        document.querySelectorAll('.code-editor-line').forEach(line => {
            line.setAttribute('dir', 'ltr');
        });
        document.querySelectorAll('.code-editor-element').forEach(el => {
            el.classList.add('direction-ltr');
            el.classList.remove('direction-rtl');
        });
        const ltrFileTab = document.querySelector('.ltr-file-tab');
        const rtlFileTab = document.querySelector('.rtl-file-tab');
        if (ltrFileTab) ltrFileTab.classList.remove('hidden');
        if (rtlFileTab) rtlFileTab.classList.add('hidden');
        const languageIndicator = document.querySelector('.code-editor-language-indicator');
        if (languageIndicator) {
            languageIndicator.classList.add('ml-auto', 'mr-0');
            languageIndicator.classList.remove('ml-0', 'mr-auto');
        }
        }
    }
    lastLangCode = lang.code;
    }

    currentIndex = (currentIndex + 1) % languages.length;
}, 500);
}

// Wait for DOM to be fully loaded
document.addEventListener('DOMContentLoaded', () => {
initializeElements();

// Initial delay before starting the animation
setTimeout(() => {
    // Update text every 5 seconds
    setInterval(updateText, 5000);
}, 2000);
});