var types = {
    'Primitive':'star | rect | triangle | diamond | circle | dot',
    'Integer':(e) => {
        return !isNaN(parseInt(e));
    }
};

var set = (...args) => {
    return {
        type:'set',
        elems:args
    };
};

var rules = [
    {
        name:"Param1",
        signature:"(λx f)(e)",
        rule:"(e, f) => f[x:=e]"
    },
    {
        name:"Iden",
        signature:"(λx #x)(e)",
        alt:"Param1(e, x)",
        rule:"e => e"
    },
    {
        name:"Dup",
        signature:"(λx #x #x)(e)",
        rule:"e => e e"
    },
    {
        name:"Trip",
        signature:"(λx #x #x #x)(e)",
        rule:"e => e e e"
    },
    {
        name:"Const",
        signature:"(λx v)(e); v = Primitive | Integer",
        rule:"(e, v) => v"
    }
];
