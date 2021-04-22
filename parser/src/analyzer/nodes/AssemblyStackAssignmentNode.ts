import { AssemblyStackAssignment } from "@solidity-parser/parser/dist/ast-types";

import { Location, FinderType, Node } from "./Node";

export class AssemblyStackAssignmentNode implements Node {
    type: string;
    uri: string;
    astNode: AssemblyStackAssignment;

    nameLoc?: Location | undefined;

    parent?: Node | undefined;
    children: Node[] = [];

    constructor (assemblyStackAssignment: AssemblyStackAssignment, uri: string) {
        this.type = assemblyStackAssignment.type;
        this.uri = uri;
        this.astNode = assemblyStackAssignment;
        // TO-DO: Implement name location for rename
    }

    getName(): string | undefined {
        return undefined;
    }

    addChild(child: Node): void {
        this.children.push(child);
    }

    setParent(parent: Node): void {
        this.parent = parent;
    }

    accept(find: FinderType, orphanNodes: Node[], parent?: Node): Node {
        // TO-DO: Method not implemented
        return this;
    }
}