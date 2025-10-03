class LayoutBuilder {
  constructor() {
    this.components = [];
    this.selectedComponent = null;
    this.dragState = {
      isDragging: false,
      dragType: null, // 'palette' or 'move' or 'resize'
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      startWidth: 0,
      startHeight: 0,
      resizeHandle: null,
      draggedElement: null,
    };
    this.allowOverlap = true;
    this.nextId = 1;

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPaletteDrag();
    this.setupCanvasDrop();
    this.setupToolbar();
    this.setupModals();
  }

  setupEventListeners() {
    // Prevent default drag behavior on document
    document.addEventListener("dragover", (e) => e.preventDefault());
    document.addEventListener("drop", (e) => e.preventDefault());

    // Touch events for mobile support
    document.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });

    // Mouse events
    document.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", (e) => this.handleMouseUp(e));

    // Keyboard events
    document.addEventListener("keydown", (e) => this.handleKeyDown(e));
  }

  setupPaletteDrag() {
    const paletteItems = document.querySelectorAll(".palette-item");
    paletteItems.forEach((item) => {
      item.addEventListener("dragstart", (e) => {
        e.dataTransfer.setData("text/plain", item.dataset.type);
        e.dataTransfer.effectAllowed = "copy";
        item.style.opacity = "0.5";
      });

      item.addEventListener("dragend", (e) => {
        item.style.opacity = "1";
      });
    });
  }

  setupCanvasDrop() {
    const canvas = document.getElementById("canvas");

    canvas.addEventListener("dragover", (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = "copy";
    });

    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      const componentType = e.dataTransfer.getData("text/plain");
      if (componentType) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        this.addComponent(componentType, x, y);
      }
    });
  }

  setupToolbar() {
    document
      .getElementById("save-layout")
      .addEventListener("click", () => this.saveLayout());
    document
      .getElementById("clear-all")
      .addEventListener("click", () => this.clearAll());
    document
      .getElementById("view-json")
      .addEventListener("click", () => this.viewJSON());
    document.getElementById("allow-overlap").addEventListener("change", (e) => {
      this.allowOverlap = e.target.checked;
      if (!this.allowOverlap) {
        this.resolveOverlaps();
      }
    });
  }

  setupModals() {
    // JSON Modal
    document.getElementById("close-json").addEventListener("click", () => {
      document.getElementById("json-modal").classList.remove("show");
    });

    // Confirmation Modal
    document.getElementById("confirm-cancel").addEventListener("click", () => {
      document.getElementById("confirm-modal").classList.remove("show");
    });

    document.getElementById("confirm-ok").addEventListener("click", () => {
      document.getElementById("confirm-modal").classList.remove("show");
      if (this.pendingAction) {
        this.pendingAction();
        this.pendingAction = null;
      }
    });

    // Close modals on backdrop click
    document.getElementById("json-modal").addEventListener("click", (e) => {
      if (e.target.id === "json-modal") {
        document.getElementById("json-modal").classList.remove("show");
      }
    });

    document.getElementById("confirm-modal").addEventListener("click", (e) => {
      if (e.target.id === "confirm-modal") {
        document.getElementById("confirm-modal").classList.remove("show");
      }
    });
  }

  addComponent(type, x, y) {
    const id = this.nextId++;
    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    // Default sizes
    let width = 200,
      height = 80;
    if (type === "section") {
      width = 300;
      height = 200;
    }

    const component = {
      id,
      type,
      label: this.getDefaultLabel(type),
      x: snappedX,
      y: snappedY,
      width,
      height,
      options: type === "picklist" ? ["Option 1", "Option 2"] : [],
    };

    // Check for overlaps if not allowed
    if (!this.allowOverlap) {
      const adjustedPos = this.findNonOverlappingPosition(component);
      component.x = adjustedPos.x;
      component.y = adjustedPos.y;
    }

    this.components.push(component);
    this.renderComponent(component);
    this.selectComponent(component.id);
  }

  getDefaultLabel(type) {
    const labels = {
      text: "Text Field",
      textarea: "Text Area",
      picklist: "Picklist",
      checkbox: "Checkbox",
      section: "Section",
    };
    return labels[type] || "Component";
  }

  renderComponent(component) {
    const canvas = document.getElementById("canvas");
    const element = document.createElement("div");
    element.className = `component ${component.type}`;
    element.dataset.id = component.id;
    element.style.left = `${component.x}px`;
    element.style.top = `${component.y}px`;
    element.style.width = `${component.width}px`;
    element.style.height = `${component.height}px`;

    // Add label
    const label = document.createElement("div");
    label.className = "component-label";
    label.textContent = component.label;
    element.appendChild(label);

    // Add remove button
    const removeBtn = document.createElement("button");
    removeBtn.className = "component-remove";
    removeBtn.innerHTML = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeComponent(component.id);
    });
    element.appendChild(removeBtn);

    // Add resize handles
    const resizeHandles = document.createElement("div");
    resizeHandles.className = "resize-handles";
    const handleTypes = ["nw", "ne", "sw", "se", "n", "e", "s", "w"];
    handleTypes.forEach((handleType) => {
      const handle = document.createElement("div");
      handle.className = `resize-handle ${handleType}`;
      handle.dataset.handle = handleType;
      resizeHandles.appendChild(handle);
    });
    element.appendChild(resizeHandles);

    // Add event listeners
    element.addEventListener("click", (e) => {
      e.stopPropagation();
      this.selectComponent(component.id);
    });

    canvas.appendChild(element);
  }

  selectComponent(id) {
    // Deselect all
    document.querySelectorAll(".component").forEach((el) => {
      el.classList.remove("selected");
    });

    // Select new component
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.classList.add("selected");
      this.selectedComponent = this.components.find((c) => c.id === id);
    }
  }

  removeComponent(id) {
    this.components = this.components.filter((c) => c.id !== id);
    const element = document.querySelector(`[data-id="${id}"]`);
    if (element) {
      element.remove();
    }
    if (this.selectedComponent && this.selectedComponent.id === id) {
      this.selectedComponent = null;
    }
  }

  handleMouseDown(e) {
    if (e.target.closest(".component")) {
      const component = e.target.closest(".component");
      const id = parseInt(component.dataset.id);

      // Check if clicking on resize handle
      const resizeHandle = e.target.closest(".resize-handle");
      if (resizeHandle) {
        e.preventDefault();
        this.startResize(id, resizeHandle.dataset.handle, e.clientX, e.clientY);
        return;
      }

      // Check if clicking on remove button
      if (e.target.closest(".component-remove")) {
        return;
      }

      // Start move operation
      this.startMove(id, e.clientX, e.clientY);
    } else {
      // Click on canvas - deselect all
      this.selectComponent(null);
    }
  }

  handleMouseMove(e) {
    if (this.dragState.isDragging) {
      e.preventDefault();
      const deltaX = e.clientX - this.dragState.startX;
      const deltaY = e.clientY - this.dragState.startY;

      if (this.dragState.dragType === "move") {
        this.updateMove(deltaX, deltaY);
      } else if (this.dragState.dragType === "resize") {
        this.updateResize(deltaX, deltaY);
      }
    }
  }

  handleMouseUp(e) {
    if (this.dragState.isDragging) {
      this.endDrag();
    }
  }

  handleTouchStart(e) {
    if (e.touches.length === 1) {
      const touch = e.touches[0];
      const target = document.elementFromPoint(touch.clientX, touch.clientY);

      if (target && target.closest(".component")) {
        e.preventDefault();
        const component = target.closest(".component");
        const id = parseInt(component.dataset.id);

        // Check if touching resize handle
        const resizeHandle = target.closest(".resize-handle");
        if (resizeHandle) {
          this.startResize(
            id,
            resizeHandle.dataset.handle,
            touch.clientX,
            touch.clientY
          );
          return;
        }

        // Check if touching remove button
        if (target.closest(".component-remove")) {
          return;
        }

        // Start move operation
        this.startMove(id, touch.clientX, touch.clientY);
      }
    }
  }

  handleTouchMove(e) {
    if (this.dragState.isDragging && e.touches.length === 1) {
      e.preventDefault();
      const touch = e.touches[0];
      const deltaX = touch.clientX - this.dragState.startX;
      const deltaY = touch.clientY - this.dragState.startY;

      if (this.dragState.dragType === "move") {
        this.updateMove(deltaX, deltaY);
      } else if (this.dragState.dragType === "resize") {
        this.updateResize(deltaX, deltaY);
      }
    }
  }

  handleTouchEnd(e) {
    if (this.dragState.isDragging) {
      this.endDrag();
    }
  }

  startMove(id, clientX, clientY) {
    const component = this.components.find((c) => c.id === id);
    if (!component) return;

    this.dragState = {
      isDragging: true,
      dragType: "move",
      startX: clientX,
      startY: clientY,
      startLeft: component.x,
      startTop: component.y,
      draggedElement: document.querySelector(`[data-id="${id}"]`),
    };

    this.selectComponent(id);
  }

  startResize(id, handle, clientX, clientY) {
    const component = this.components.find((c) => c.id === id);
    if (!component) return;

    this.dragState = {
      isDragging: true,
      dragType: "resize",
      startX: clientX,
      startY: clientY,
      startLeft: component.x,
      startTop: component.y,
      startWidth: component.width,
      startHeight: component.height,
      resizeHandle: handle,
      draggedElement: document.querySelector(`[data-id="${id}"]`),
    };

    this.selectComponent(id);
  }

  updateMove(deltaX, deltaY) {
    const component = this.components.find(
      (c) => c.id === parseInt(this.dragState.draggedElement.dataset.id)
    );
    if (!component) return;

    let newX = this.dragState.startLeft + deltaX;
    let newY = this.dragState.startTop + deltaY;

    // Snap to grid
    newX = this.snapToGrid(newX);
    newY = this.snapToGrid(newY);

    // Check bounds
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    // Check for overlaps if not allowed
    if (!this.allowOverlap) {
      const testComponent = { ...component, x: newX, y: newY };
      if (this.hasOverlap(testComponent, component.id)) {
        return; // Don't move if it would overlap
      }
    }

    component.x = newX;
    component.y = newY;
    this.dragState.draggedElement.style.left = `${newX}px`;
    this.dragState.draggedElement.style.top = `${newY}px`;
  }

  updateResize(deltaX, deltaY) {
    const component = this.components.find(
      (c) => c.id === parseInt(this.dragState.draggedElement.dataset.id)
    );
    if (!component) return;

    let newX = component.x;
    let newY = component.y;
    let newWidth = component.width;
    let newHeight = component.height;

    const handle = this.dragState.resizeHandle;

    // Calculate new dimensions based on handle
    if (handle.includes("e")) {
      newWidth = this.dragState.startWidth + deltaX;
    }
    if (handle.includes("w")) {
      newWidth = this.dragState.startWidth - deltaX;
      newX = this.dragState.startLeft + deltaX;
    }
    if (handle.includes("s")) {
      newHeight = this.dragState.startHeight + deltaY;
    }
    if (handle.includes("n")) {
      newHeight = this.dragState.startHeight - deltaY;
      newY = this.dragState.startTop + deltaY;
    }

    // Apply minimum dimensions
    newWidth = Math.max(100, newWidth);
    newHeight = Math.max(60, newHeight);

    // Snap to grid
    newX = this.snapToGrid(newX);
    newY = this.snapToGrid(newY);
    newWidth = this.snapToGrid(newWidth);
    newHeight = this.snapToGrid(newHeight);

    // Check bounds
    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    // Check for overlaps if not allowed
    if (!this.allowOverlap) {
      const testComponent = {
        ...component,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      if (this.hasOverlap(testComponent, component.id)) {
        return; // Don't resize if it would overlap
      }
    }

    component.x = newX;
    component.y = newY;
    component.width = newWidth;
    component.height = newHeight;

    this.dragState.draggedElement.style.left = `${newX}px`;
    this.dragState.draggedElement.style.top = `${newY}px`;
    this.dragState.draggedElement.style.width = `${newWidth}px`;
    this.dragState.draggedElement.style.height = `${newHeight}px`;
  }

  endDrag() {
    this.dragState = {
      isDragging: false,
      dragType: null,
      startX: 0,
      startY: 0,
      startLeft: 0,
      startTop: 0,
      startWidth: 0,
      startHeight: 0,
      resizeHandle: null,
      draggedElement: null,
    };
  }

  snapToGrid(value) {
    return Math.round(value / 4) * 4;
  }

  hasOverlap(component, excludeId) {
    return this.components.some((other) => {
      if (other.id === excludeId) return false;
      return !(
        component.x >= other.x + other.width ||
        component.x + component.width <= other.x ||
        component.y >= other.y + other.height ||
        component.y + component.height <= other.y
      );
    });
  }

  findNonOverlappingPosition(component) {
    const gridSize = 4;
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (!this.hasOverlap(component, component.id)) {
        return { x: component.x, y: component.y };
      }

      // Try next position
      component.x += gridSize;
      if (component.x > 800) {
        component.x = 0;
        component.y += gridSize;
      }
      attempts++;
    }

    // Fallback to original position
    return { x: component.x, y: component.y };
  }

  resolveOverlaps() {
    // Simple overlap resolution - move overlapping components
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      for (let j = i + 1; j < this.components.length; j++) {
        const other = this.components[j];
        if (this.hasOverlap(component, other.id)) {
          // Move the second component
          const newPos = this.findNonOverlappingPosition(other);
          other.x = newPos.x;
          other.y = newPos.y;

          // Update DOM
          const element = document.querySelector(`[data-id="${other.id}"]`);
          if (element) {
            element.style.left = `${other.x}px`;
            element.style.top = `${other.y}px`;
          }
        }
      }
    }
  }

  handleKeyDown(e) {
    if (e.key === "Delete" && this.selectedComponent) {
      this.removeComponent(this.selectedComponent.id);
    }
  }

  saveLayout() {
    const layoutData = {
      components: this.components,
      allowOverlap: this.allowOverlap,
      timestamp: new Date().toISOString(),
    };

    // In a real application, this would save to a server
    console.log("Layout saved:", layoutData);
    alert("Layout saved! (Check console for JSON data)");
  }

  clearAll() {
    this.pendingAction = () => {
      this.components = [];
      document.querySelectorAll(".component").forEach((el) => el.remove());
      this.selectedComponent = null;
    };

    document.getElementById("confirm-message").textContent =
      "Are you sure you want to clear all components?";
    document.getElementById("confirm-modal").classList.add("show");
  }

  viewJSON() {
    const layoutData = {
      components: this.components,
      allowOverlap: this.allowOverlap,
      timestamp: new Date().toISOString(),
    };

    document.getElementById("json-content").textContent = JSON.stringify(
      layoutData,
      null,
      2
    );
    document.getElementById("json-modal").classList.add("show");
  }
}

// Initialize the layout builder when the page loads
document.addEventListener("DOMContentLoaded", () => {
  new LayoutBuilder();
});
