import {
	Location as NodeLocation, Node,
	ContractDefinitionNode, definitionNodeTypes
} from "../../../parser/out/analyzer/nodes/Node";
import * as finder from "../../../parser/out/analyzer/finder";

import {
	TextDocument, Position, Location,
	Range, WorkspaceEdit, TextEdit
} from "../types/languageTypes";

export class SolidityNavigation {
	public findDefinition(position: Position, analyzerTree: Node): Location | undefined {
		const definitionNode = this.findNodeByPosition(position, analyzerTree);

		if (definitionNode && definitionNode.astNode.loc) {
			return {
				uri: definitionNode.uri,
				range: this.getRange(definitionNode.astNode.loc)
			};
		}

		return undefined;
	}

	public findTypeDefinition(position: Position, analyzerTree: Node): Location[] {
		const definitionNode = this.findNodeByPosition(position, analyzerTree);

		if (!definitionNode) {
			return [];
		}

		return this.getHighlightLocations(definitionNode.getTypeNodes());
	}

	public findReferences(position: Position, analyzerTree: Node): Location[] {
		const highlightNodes = this.findHighlightNodes(position, analyzerTree);
        return this.getHighlightLocations(highlightNodes);
	}

	public findImplementation(position: Position, analyzerTree: Node): Location[] {
		const highlightNodes = this.findHighlightNodes(position, analyzerTree);

		const implementationNodes: Node[] = [];
		for (const highlightNode of highlightNodes) {
			if (definitionNodeTypes.includes(highlightNode.type)) {
				implementationNodes.push(highlightNode);
			}
		}

        return this.getHighlightLocations(implementationNodes);
	}

	public doRename(document: TextDocument, position: Position, newName: string, analyzerTree: Node): WorkspaceEdit {
		const highlightNodes = this.findHighlightNodes(position, analyzerTree);
		const edits: TextEdit[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc) {
				const range = this.getRange(highlightNode.nameLoc);

				edits.push(TextEdit.replace(range, newName));
			}
		});

		return {
			changes: {
				[document.uri]: edits
			}
		};
	}

	private getHighlightLocations(highlightNodes: Node[]): Location[] {
		const locations: Location[] = [];

		highlightNodes.forEach(highlightNode => {
			if (highlightNode.nameLoc) {
				locations.push({
					uri: highlightNode.uri,
					range: this.getRange(highlightNode.nameLoc)
				});
			}
		});

        return locations;
	}

	private findHighlightNodes(position: Position, analyzerTree: Node): Node[] {
		const highlights: Node[] = [];

		const node = this.findNodeByPosition(position, analyzerTree);

		const nodeName = node?.getName();
		if (node && nodeName) {
			this.extractHighlightsFromNodeRecursive(nodeName, node, highlights);
		}

        return highlights;
	}

	private findNodeByPosition(position: Position, analyzerTree: Node): Node | undefined {
		return finder.findNodeByPosition({
			// TO-DO: Remove +1 when "@solidity-parser" fix line counting.
			// Why +1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
			line: position.line + 1,
			column: position.character
		}, analyzerTree);
	}

	private extractHighlightsFromNodeRecursive(name: string, node: Node, results: Node[], visitedNodes?: Node[]): void {
		if (!visitedNodes) {
			visitedNodes = [];
		}

		if (visitedNodes.includes(node)) {
			return;
		}

		visitedNodes.push(node);

		if (name === node.getName()) {
			results.push(node);
		}

		for (const child of node.children) {
			this.extractHighlightsFromNodeRecursive(name, child, results, visitedNodes);
		}
	}

	private extractHighlightsFromNode(name: string, node: Node): Node[] {
		const highlights: Node[] = [];

		if (name === node.getName()) {
			highlights.push(node);
		}

		for (const child of node.children) {
			if (name === child.getName()) {
				highlights.push(child);
			}
		}

		return highlights;
	}

	private getRange(loc: NodeLocation): Range {
		// TO-DO: Remove -1 when "@solidity-parser" fix line counting.
		// Why -1? Because "vs-code" line counting from 0, and "@solidity-parser" from 1.
		return Range.create(
			Position.create(loc.start.line - 1, loc.start.column),
			Position.create(loc.end.line - 1, loc.end.column),
		);
	}
}
