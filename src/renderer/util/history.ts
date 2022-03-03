interface Operation {
    execute: ()=>void;
    undo: ()=>void;

    next: Operation | null;
    prev: Operation | null;
}

function createOperation(execute:()=>void, undo:()=>void): Operation {
  return {
    'execute': execute,
    'undo': undo,
    'next': null,
    'prev': null
  };
}

export class OperationUndoStack {
  private top: Operation | null = null;
  private bottom: Operation | null = null;

  private size = 0;
  private maxSize: number;

  constructor(maxSize:number) {
    this.maxSize = maxSize;
  }

  executeUndoableOperation(execute:()=>void, undo:()=>void) {
    const operation = createOperation(execute, undo);

    if (this.isEmpty()) {
      this.top = operation;
      this.bottom = operation;
      ++this.size;
    } else if (this.isFull()) {
      // stack is full, drop the bottom (least recently executed)
      this.bottom = (this.bottom as Operation).next;
      (this.bottom as Operation).prev = null;

      operation.prev = this.top;
      (this.top as Operation).next = operation;
      this.top = operation;
    } else {
      operation.prev = this.top;
      (this.top as Operation).next = operation;
      this.top = operation;
      ++this.size;
    }

    execute();
  }

  undo() {
    if (this.isEmpty()) {
      throw Error('Nothing to undo!');
    }

    (this.top as Operation).undo();

    this.top = (this.top as Operation).prev;

    --this.size;
  }

  redo() {
    if (this.isEmpty()) {
      if (this.bottom !== null) {
        this.top = this.bottom;
        (this.top as Operation).execute();
        ++this.size;
        return;
      }

      throw Error('Nothing to redo!');
    }

    if (this.isFull() || (this.top as Operation).next === null) {
      throw Error('Nothing to redo!');
    }

    this.top = (this.top as Operation).next;
    (this.top as Operation).execute();
    ++this.size;
  }

  isEmpty(): boolean {
    return this.size === 0;
  }

  isFull():boolean {
    return this.size === this.maxSize;
  }
}
