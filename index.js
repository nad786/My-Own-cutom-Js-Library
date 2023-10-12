let str = "key != 'pkg'";
let arr = str.split(/\s(&&|\|\|)\s/);
arr = arr.filter((item, index) => item && index%2==0).map(item => {
    const temp = item.split(/[\s]*[!]*[=]*[==][\s]*/) 
    if(temp[0]?.[0] != "'" || temp[0]?.[0] != '"') {
        return temp[0];
    }
    return temp[1];
});

console.log(arr);
