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

interface CodeElements {
languageIndicator: HTMLElement | null;
fileName: HTMLElement | null;
funcKeyword: HTMLElement | null;
funcName: HTMLElement | null;
paramName: HTMLElement | null;
typeHint: HTMLElement | null;
docstring: HTMLElement | null;
docstringText: HTMLElement | null;
docstringEnd: HTMLElement | null;
comment1: HTMLElement | null;
inputFunc: HTMLElement | null;
promptText: HTMLElement | null;
comment2: HTMLElement | null;
printKeyword: HTMLElement | null;
fString: HTMLElement | null;
welcomeText: HTMLElement | null;
comment3: HTMLElement | null;
returnKeyword: HTMLElement | null;
returnVar: HTMLElement | null;
nameValue: HTMLElement | null;
printKeyword2: HTMLElement | null;
funcCall: HTMLElement | null;
varName: HTMLElement | null;
usernameDeclaration: HTMLElement | null;
usernameArgument: HTMLElement | null;
welcomePrefix: HTMLElement | null;
welcomeSuffix: HTMLElement | null;
fStringVar: HTMLElement | null;
}

let elements: CodeElements = {
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
    (el as HTMLElement).style.opacity = '0';
    }
});

setTimeout(() => {
    // Update only changed elements and fade in
    Object.entries(elements).forEach(([key, el]) => {
    if (!el) return;
    if (virtualState[key] !== undefined && virtualState[key] !== currentState[key]) {
        (el as HTMLElement).textContent = virtualState[key];
        (el as HTMLElement).style.opacity = '1';
    }
    });

    // Only update RTL/LTR logic if the language changes
    if (lang.code !== lastLangCode) {
    if (elements.fileName) {
        const rtlFileName = document.getElementById('file-name-rtl');
        if (rtlFileName) (rtlFileName as HTMLElement).textContent = lang.fileName;

        if (lang.code === "ar") {
        (elements.fileName as HTMLElement).style.direction = "rtl";
        document.querySelectorAll('.code-editor-line').forEach(line => {
            (line as HTMLElement).setAttribute('dir', 'rtl');
        });
        document.querySelectorAll('.code-editor-element').forEach(el => {
            (el as HTMLElement).style.direction = 'rtl';
        });
        const ltrFileTab = document.querySelector('.ltr-file-tab');
        const rtlFileTab = document.querySelector('.rtl-file-tab');
        if (ltrFileTab) (ltrFileTab as HTMLElement).classList.add('hidden');
        if (rtlFileTab) (rtlFileTab as HTMLElement).classList.remove('hidden');
        const languageIndicator = document.querySelector('.code-editor-language-indicator');
        if (languageIndicator) {
            (languageIndicator as HTMLElement).style.marginLeft = '0';
            (languageIndicator as HTMLElement).style.marginRight = 'auto';
        }
        } else {
        (elements.fileName as HTMLElement).style.direction = "ltr";
        document.querySelectorAll('.code-editor-line').forEach(line => {
            (line as HTMLElement).setAttribute('dir', 'ltr');
        });
        document.querySelectorAll('.code-editor-element').forEach(el => {
            (el as HTMLElement).style.direction = 'ltr';
        });
        const ltrFileTab = document.querySelector('.ltr-file-tab');
        const rtlFileTab = document.querySelector('.rtl-file-tab');
        if (ltrFileTab) (ltrFileTab as HTMLElement).classList.remove('hidden');
        if (rtlFileTab) (rtlFileTab as HTMLElement).classList.add('hidden');
        const languageIndicator = document.querySelector('.code-editor-language-indicator');
        if (languageIndicator) {
            (languageIndicator as HTMLElement).style.marginLeft = 'auto';
            (languageIndicator as HTMLElement).style.marginRight = '0';
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