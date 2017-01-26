class Environment {
    constructor(parent=null) {
        this.parent = parent;
        this.bindings = {};
        this.bound = {};
    }

    lookup(key) {
        let value = this.bindings[key];
        if (value) return value;

        if (this.bound[key]) return null;

        if (this.parent) {
            return this.parent.lookup(key);
        }

        return null;
    }

    lookupDirect(key) {
        let value = this.bindings[key];
        if (value) return value;
        return null;
    }

    update(key, value) {
        this.bindings[key] = value;
    }

    names() {
        let set = new Set([
            ...Object.keys(this.bindings),
            ...(this.parent ? this.parent.names() : []),
        ]);
        return Array.from(set);
    }

    static parse(desc) {
        let bindings = {};
        let env = new Environment();
        for (let name of Object.keys(desc)) {
            let expr = Level.parse(desc[name]);
            if (expr.length !== 1) {
                throw "Invalid description of global value: " + name + "=" + desc[name];
            }
            env.update(name, expr[0]);
        }
        return env;
    }
}
