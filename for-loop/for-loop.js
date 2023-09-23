const temp1 = MyLibrary.create({list: ["1st item", "2nd item"]}  )


temp1.list.push("3rd item");
temp1.list[2] = "3rd item modified"


//we can create this inside temp1 also as persons property
const temp2 = MyLibrary.create({persons: [{fname: "md", lname: "nadeem"}]}  )


temp2.persons.push({fname: "john", lname: "doe"});
temp2.persons[2] = {fname: "firstName"};
temp2.persons[2].lname = "LastName"
