function capitalize(str) {
    return str.charAt(0).toUpperCase() + str.slice(1);
}

function reverseString(str) {
    return str.split("").reverse().join("");
}

function countVowels(str) {
    return (str.match(/[aeiou]/gi) || []).length;
}

module.exports = {
    capitalize,
    reverseString,
    countVowels
};
