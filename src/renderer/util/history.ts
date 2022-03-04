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

/**
 * A stack for operations which you might want to undo/redo.
 *
 * Has a max size, which once exceeded drops elements from the bottom of the stack.
 */
export class OperationUndoStack {
  #top: Operation | null = null;
  #bottom: Operation | null = null;

  #size = 0;
  #maxSize: number;

  constructor(maxSize:number) {
    this.#maxSize = maxSize;
  }

  /**
   * Executes an operation and adds it to the stack
   *
   * @param execute The lambda for the application of the operation
   * @param undo The lambda for the inverse of the operation
   */
  executeUndoableOperation(execute:()=>void, undo:()=>void) {
    const operation = createOperation(execute, undo);

    if (this.isEmpty()) {
      this.#top = operation;
      this.#bottom = operation;
      ++this.#size;
    } else if (this.isFull()) {
      // stack is full, drop the bottom (least recently executed)
      this.#bottom = (this.#bottom as Operation).next;
      (this.#bottom as Operation).prev = null;

      operation.prev = this.#top;
      (this.#top as Operation).next = operation;
      this.#top = operation;
    } else {
      operation.prev = this.#top;
      (this.#top as Operation).next = operation;
      this.#top = operation;
      ++this.#size;
    }

    execute();
  }

  /**
   * Undoes the #top operation of the stack.
   *
   * Throws error if stack empty.
   */
  undo() {
    if (this.isEmpty()) {
      throw Error('Nothing to undo!');
    }

    (this.#top as Operation).undo();

    this.#top = (this.#top as Operation).prev;

    --this.#size;
  }

  /**
   * Redoes a previously undone operation.
   *
   * Throws error if nothing avaliable to redo.
   */
  redo() {
    if (this.isEmpty()) {
      if (this.#bottom !== null) {
        this.#top = this.#bottom;
        this.#top.execute();
        ++this.#size;
        return;
      }

      throw Error('Nothing to redo!');
    }

    if (this.isFull() || (this.#top as Operation).next === null) {
      throw Error('Nothing to redo!');
    }

    this.#top = (this.#top as Operation).next;
    (this.#top as Operation).execute();
    ++this.#size;
  }

  isEmpty(): boolean {
    return this.#size === 0;
  }

  isFull():boolean {
    return this.#size === this.#maxSize;
  }

  /**
   * Will undo() succeed?
   */
  canUndo(): boolean {
    return this.#top !== null;
  }

  /**
   * Will redo() succeed?
   */
  canRedo(): boolean {
    return !this.isFull() && !(this.isEmpty() && this.#bottom === null);
  }
}
