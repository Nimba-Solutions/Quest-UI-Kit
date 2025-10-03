// All-in-one Layout Builder - works with file:// URLs
class Component {
  constructor(id, type, x, y, width, height, options = []) {
    this.id = id;
    this.type = type;
    this.x = x;
    this.y = y;
    this.width = width;
    this.height = height;
    this.options = options;
    this.parentSectionId = null;
    this.children = type === "section" ? [] : null;
    this.label = this.getDefaultLabel(type);
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

  isInSection() {
    return this.parentSectionId !== null;
  }

  isSection() {
    return this.type === "section";
  }

  addChild(childId) {
    if (this.isSection() && this.children) {
      this.children.push(childId);
    }
  }

  removeChild(childId) {
    if (this.isSection() && this.children) {
      this.children = this.children.filter((id) => id !== childId);
    }
  }

  toJSON() {
    return {
      id: this.id,
      type: this.type,
      label: this.label,
      x: this.x,
      y: this.y,
      width: this.width,
      height: this.height,
      options: this.options,
      parentSectionId: this.parentSectionId,
      children: this.children,
    };
  }
}

class LayoutBuilder {
  constructor() {
    this.components = [];
    this.selectedComponent = null;
    this.allowOverlap = true;
    this.gridSize = 16; // Default grid size
    this.nextId = 1;
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

    this.init();
  }

  init() {
    this.setupEventListeners();
    this.setupPaletteDrag();
    this.setupCanvasDrop();
    this.setupToolbar();
    this.setupModals();
    this.setupPropertiesPanel();
    this.updateGridBackground(); // Set initial grid background
  }

  setupEventListeners() {
    document.addEventListener("dragover", (e) => {
      if (!e.target.closest("#canvas")) {
        e.preventDefault();
      }
    });
    document.addEventListener("drop", (e) => {
      if (!e.target.closest("#canvas")) {
        e.preventDefault();
      }
    });

    document.addEventListener("touchstart", (e) => this.handleTouchStart(e), {
      passive: false,
    });
    document.addEventListener("touchmove", (e) => this.handleTouchMove(e), {
      passive: false,
    });
    document.addEventListener("touchend", (e) => this.handleTouchEnd(e), {
      passive: false,
    });

    document.addEventListener("mousedown", (e) => this.handleMouseDown(e));
    document.addEventListener("mousemove", (e) => this.handleMouseMove(e));
    document.addEventListener("mouseup", (e) => this.handleMouseUp(e));
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
      e.stopPropagation();
      e.dataTransfer.dropEffect = "copy";
    });

    canvas.addEventListener("dragenter", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvas.classList.add("canvas-drag-over");
    });

    canvas.addEventListener("dragleave", (e) => {
      if (!canvas.contains(e.relatedTarget)) {
        canvas.classList.remove("canvas-drag-over");
      }
    });

    canvas.addEventListener("drop", (e) => {
      e.preventDefault();
      e.stopPropagation();
      canvas.classList.remove("canvas-drag-over");

      const componentType = e.dataTransfer.getData("text/plain");
      if (componentType) {
        const rect = canvas.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;

        const targetSection = this.getSectionAtPosition(x, y);
        if (targetSection) {
          this.addComponent(componentType, x, y, targetSection.id);
        } else {
          this.addComponent(componentType, x, y);
        }
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

    document.getElementById("grid-snap").addEventListener("change", (e) => {
      this.gridSize = parseInt(e.target.value);
      this.updateGridBackground();
    });
  }

  setupModals() {
    document.getElementById("close-json").addEventListener("click", () => {
      document.getElementById("json-modal").classList.remove("show");
    });

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

  addComponent(type, x, y, parentSectionId = null) {
    const id = this.nextId++;
    const snappedX = this.snapToGrid(x);
    const snappedY = this.snapToGrid(y);

    let width = 200,
      height = 80;
    if (type === "section") {
      width = 300;
      height = 200;
    }

    const component = new Component(
      id,
      type,
      snappedX,
      snappedY,
      width,
      height,
      type === "picklist" ? ["Option 1", "Option 2"] : []
    );
    component.parentSectionId = parentSectionId;

    if (!this.allowOverlap) {
      const adjustedPos = this.findNonOverlappingPosition(component);
      component.x = adjustedPos.x;
      component.y = adjustedPos.y;
    }

    if (parentSectionId) {
      const parentSection = this.components.find(
        (c) => c.id === parentSectionId
      );
      if (parentSection) {
        // Convert absolute coordinates to relative coordinates within the parent section
        component.x = snappedX - parentSection.x;
        component.y = snappedY - parentSection.y;

        // Ensure the component stays within the parent section bounds
        component.x = Math.max(
          0,
          Math.min(component.x, parentSection.width - component.width)
        );
        component.y = Math.max(
          0,
          Math.min(component.y, parentSection.height - component.height)
        );

        parentSection.addChild(id);
      }
    }

    this.components.push(component);
    this.renderComponent(component);
    this.selectComponent(component.id);
  }

  renderComponent(component) {
    const canvas = document.getElementById("canvas");
    const element = document.createElement("div");
    element.className = `component ${component.type}`;
    element.dataset.id = component.id;

    // For child components, append them to their parent section instead of main canvas
    if (component.parentSectionId) {
      const parentSectionElement = document.querySelector(
        `[data-id="${component.parentSectionId}"]`
      );
      if (parentSectionElement) {
        // Position relative to parent section (not absolute)
        element.style.left = `${component.x}px`;
        element.style.top = `${component.y}px`;
        element.style.width = `${component.width}px`;
        element.style.height = `${component.height}px`;

        // Ensure child components have higher z-index than parents
        const parentZIndex =
          parseInt(getComputedStyle(parentSectionElement).zIndex) || 0;
        element.style.zIndex = (parentZIndex + 1).toString();

        parentSectionElement.appendChild(element);

        // Create resize handles and other elements for child components
        this.createComponentElements(element, component);
        return; // Don't add to main canvas
      }
    }

    // For top-level components, use absolute positioning
    element.style.left = `${component.x}px`;
    element.style.top = `${component.y}px`;
    element.style.width = `${component.width}px`;
    element.style.height = `${component.height}px`;

    // Set z-index for top-level components
    element.style.zIndex = "1";

    canvas.appendChild(element);
    this.createComponentElements(element, component);
  }

  createComponentElements(element, component) {
    const label = document.createElement("div");
    label.className = "component-label";
    // Show the name if provided, otherwise show the label, otherwise show default
    const displayText =
      component.name ||
      component.label ||
      component.getDefaultLabel(component.type);
    label.textContent = displayText;
    element.appendChild(label);

    const removeBtn = document.createElement("button");
    removeBtn.className = "component-remove";
    removeBtn.innerHTML = "×";
    removeBtn.addEventListener("click", (e) => {
      e.stopPropagation();
      this.removeComponent(component.id);
    });
    element.appendChild(removeBtn);

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

    // Ensure resize handles are visible for nested components
    if (component.parentSectionId) {
      resizeHandles.style.zIndex = "999";
      resizeHandles.style.position = "absolute";
      resizeHandles.style.top = "0";
      resizeHandles.style.left = "0";
      resizeHandles.style.right = "0";
      resizeHandles.style.bottom = "0";
    }

    if (component.type === "section") {
      element.classList.add("section-container");
      element.addEventListener("dragover", (e) =>
        this.handleSectionDragOver(e, component.id)
      );
      element.addEventListener("drop", (e) =>
        this.handleSectionDrop(e, component.id)
      );
    }
  }

  selectComponent(id) {
    document.querySelectorAll(".component").forEach((el) => {
      el.classList.remove("selected");
    });

    if (id) {
      const element = document.querySelector(`[data-id="${id}"]`);
      if (element) {
        element.classList.add("selected");
      }
    }

    this.selectedComponent = id
      ? this.components.find((c) => c.id === id)
      : null;

    // Update properties panel
    this.updatePropertiesPanel();
  }

  removeComponent(id) {
    const component = this.components.find((c) => c.id === id);
    if (!component) return;

    if (component.isSection() && component.children) {
      component.children.forEach((childId) => {
        this.removeComponent(childId);
      });
    }

    if (component.parentSectionId) {
      const parentSection = this.components.find(
        (c) => c.id === component.parentSectionId
      );
      if (parentSection && parentSection.children) {
        parentSection.removeChild(id);
      }
    }

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
    // Find the topmost component at this click position
    const allComponents = document.querySelectorAll(".component");
    let clickedComponent = null;
    let topmostZIndex = -1;

    for (const comp of allComponents) {
      const rect = comp.getBoundingClientRect();
      if (
        e.clientX >= rect.left &&
        e.clientX <= rect.right &&
        e.clientY >= rect.top &&
        e.clientY <= rect.bottom
      ) {
        const zIndex = parseInt(getComputedStyle(comp).zIndex) || 0;
        if (zIndex > topmostZIndex) {
          topmostZIndex = zIndex;
          clickedComponent = comp;
        }
      }
    }

    if (clickedComponent) {
      const id = parseInt(clickedComponent.dataset.id);

      // Check if clicking on resize handles - use direct target check
      if (e.target.classList.contains("resize-handle")) {
        e.preventDefault();
        this.startResize(id, e.target.dataset.handle, e.clientX, e.clientY);
        return;
      }

      if (e.target.closest(".component-remove")) {
        return;
      }

      // Select the component first, then start drag operation
      this.selectComponent(id);
      this.startMove(id, e.clientX, e.clientY);
    } else {
      // Don't deselect if clicking in properties panel
      if (e.target.closest("#properties-panel")) {
        return;
      }

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

        if (target.closest(".component-remove")) {
          return;
        }

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

    newX = this.snapToGrid(newX);
    newY = this.snapToGrid(newY);

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    if (component.parentSectionId) {
      const parentSection = this.components.find(
        (c) => c.id === component.parentSectionId
      );
      if (parentSection) {
        // Keep child components within parent section bounds
        newX = Math.max(
          0,
          Math.min(newX, parentSection.width - component.width)
        );
        newY = Math.max(
          0,
          Math.min(newY, parentSection.height - component.height)
        );
      }
    }

    if (!this.allowOverlap) {
      const testComponent = { ...component, x: newX, y: newY };
      if (this.hasOverlap(testComponent, component.id)) {
        return;
      }
    }

    component.x = newX;
    component.y = newY;

    // Update position based on whether it's a child or top-level component
    if (component.parentSectionId) {
      // Child components use relative positioning
      this.dragState.draggedElement.style.left = `${component.x}px`;
      this.dragState.draggedElement.style.top = `${component.y}px`;
    } else {
      // Top-level components use absolute positioning
      this.dragState.draggedElement.style.left = `${component.x}px`;
      this.dragState.draggedElement.style.top = `${component.y}px`;
    }

    if (component.type === "section") {
      this.updateComponentPositions();
    }
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

    newWidth = Math.max(100, newWidth);
    newHeight = Math.max(60, newHeight);

    newX = this.snapToGrid(newX);
    newY = this.snapToGrid(newY);
    newWidth = this.snapToGrid(newWidth);
    newHeight = this.snapToGrid(newHeight);

    newX = Math.max(0, newX);
    newY = Math.max(0, newY);

    if (component.parentSectionId) {
      const parentSection = this.components.find(
        (c) => c.id === component.parentSectionId
      );
      if (parentSection) {
        // Keep child components within parent section bounds when resizing
        // Add 4px margin around the child section
        const maxWidth = parentSection.width - component.x - 4;
        const maxHeight = parentSection.height - component.y - 4;

        newX = Math.max(0, Math.min(newX, parentSection.width - newWidth));
        newY = Math.max(0, Math.min(newY, parentSection.height - newHeight));
        newWidth = Math.min(newWidth, maxWidth);
        newHeight = Math.min(newHeight, maxHeight);
      }
    }

    if (!this.allowOverlap) {
      const testComponent = {
        ...component,
        x: newX,
        y: newY,
        width: newWidth,
        height: newHeight,
      };
      if (this.hasOverlap(testComponent, component.id)) {
        return;
      }
    }

    component.x = newX;
    component.y = newY;
    component.width = newWidth;
    component.height = newHeight;

    // Update position based on whether it's a child or top-level component
    if (component.parentSectionId) {
      // Child components use relative positioning
      this.dragState.draggedElement.style.left = `${component.x}px`;
      this.dragState.draggedElement.style.top = `${component.y}px`;
    } else {
      // Top-level components use absolute positioning
      this.dragState.draggedElement.style.left = `${component.x}px`;
      this.dragState.draggedElement.style.top = `${component.y}px`;
    }

    this.dragState.draggedElement.style.width = `${newWidth}px`;
    this.dragState.draggedElement.style.height = `${newHeight}px`;

    if (component.type === "section") {
      this.updateComponentPositions();
    }
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

  getSectionAtPosition(x, y) {
    const sections = this.components.filter((c) => c.type === "section");

    const sortedSections = sections.sort((a, b) => {
      const depthA = this.getSectionDepth(a);
      const depthB = this.getSectionDepth(b);
      return depthB - depthA;
    });

    for (const section of sortedSections) {
      const absoluteX = section.parentSectionId
        ? this.components.find((c) => c.id === section.parentSectionId).x +
          section.x
        : section.x;
      const absoluteY = section.parentSectionId
        ? this.components.find((c) => c.id === section.parentSectionId).y +
          section.y
        : section.y;

      if (
        x >= absoluteX &&
        x <= absoluteX + section.width &&
        y >= absoluteY &&
        y <= absoluteY + section.height
      ) {
        return section;
      }
    }
    return null;
  }

  getSectionDepth(section) {
    let depth = 0;
    let current = section;
    while (current.parentSectionId) {
      depth++;
      current = this.components.find((c) => c.id === current.parentSectionId);
      if (!current) break;
    }
    return depth;
  }

  handleSectionDragOver(e, sectionId) {
    e.preventDefault();
    e.stopPropagation();
    e.dataTransfer.dropEffect = "copy";

    const sectionElement = document.querySelector(`[data-id="${sectionId}"]`);
    sectionElement.classList.add("section-drop-target");
  }

  handleSectionDrop(e, sectionId) {
    e.preventDefault();
    e.stopPropagation();

    const componentType = e.dataTransfer.getData("text/plain");
    if (componentType) {
      const rect = e.currentTarget.getBoundingClientRect();
      const x = e.clientX - rect.left;
      const y = e.clientY - rect.top;
      this.addComponent(componentType, x, y, sectionId);
    }

    const sectionElement = document.querySelector(`[data-id="${sectionId}"]`);
    sectionElement.classList.remove("section-drop-target");
  }

  updateComponentPositions() {
    this.components.forEach((component) => {
      const element = document.querySelector(`[data-id="${component.id}"]`);
      if (element) {
        if (component.parentSectionId) {
          // Child components use relative positioning
          element.style.left = `${component.x}px`;
          element.style.top = `${component.y}px`;

          // Ensure child components have higher z-index than parents
          const parentSectionElement = document.querySelector(
            `[data-id="${component.parentSectionId}"]`
          );
          if (parentSectionElement) {
            const parentZIndex =
              parseInt(getComputedStyle(parentSectionElement).zIndex) || 0;
            element.style.zIndex = (parentZIndex + 1).toString();
          }
        } else {
          // Top-level components use absolute positioning
          element.style.left = `${component.x}px`;
          element.style.top = `${component.y}px`;
          element.style.zIndex = "1";
        }
      }
    });
  }

  handleKeyDown(e) {
    if (e.key === "Delete" && this.selectedComponent) {
      this.removeComponent(this.selectedComponent.id);
    }
  }

  snapToGrid(value) {
    return Math.round(value / this.gridSize) * this.gridSize;
  }

  updateGridBackground() {
    const canvas = document.getElementById("canvas");
    canvas.style.setProperty("--grid-size", `${this.gridSize}px`);
  }

  updateComponentLabel(component) {
    const element = document.querySelector(
      `[data-id="${component.id}"] .component-label`
    );
    if (element) {
      // Show the name if provided, otherwise show the label, otherwise show default
      const displayText =
        component.name ||
        component.label ||
        component.getDefaultLabel(component.type);
      element.textContent = displayText;
    }
  }

  setupPropertiesPanel() {
    // Properties panel is set up in HTML, just need to initialize
    this.updatePropertiesPanel();
  }

  updatePropertiesPanel() {
    const propertiesContent = document.getElementById("properties-content");

    if (!this.selectedComponent) {
      propertiesContent.innerHTML =
        "<p>Select a component to edit its properties</p>";
      return;
    }

    const component = this.selectedComponent;
    let html = `<h4>${
      component.type.charAt(0).toUpperCase() + component.type.slice(1)
    } Properties</h4>`;

    // Common properties for all components
    html += `
      <div class="property-group">
        <label for="component-name">Name:</label>
        <input type="text" id="component-name" value="${
          component.name || ""
        }" placeholder="Enter component name">
      </div>
      <div class="property-group">
        <label for="component-label">Label:</label>
        <input type="text" id="component-label" value="${
          component.label || ""
        }" placeholder="Enter display label">
      </div>
    `;

    // Type-specific properties
    if (component.type === "text" || component.type === "textarea") {
      html += `
        <div class="property-group">
          <label for="component-placeholder">Placeholder:</label>
          <input type="text" id="component-placeholder" value="${
            component.placeholder || ""
          }" placeholder="Enter placeholder text">
        </div>
        <div class="property-group">
          <label for="component-default">Default Value:</label>
          <input type="text" id="component-default" value="${
            component.defaultValue || ""
          }" placeholder="Enter default value">
        </div>
      `;
    }

    if (component.type === "picklist") {
      html += `
        <div class="property-group">
          <label for="component-options">Options (one per line):</label>
          <textarea id="component-options" placeholder="Option 1&#10;Option 2&#10;Option 3">${(
            component.options || []
          ).join("\n")}</textarea>
        </div>
        <div class="property-group">
          <label for="component-default">Default Selection:</label>
          <input type="text" id="component-default" value="${
            component.defaultValue || ""
          }" placeholder="Enter default selection">
        </div>
      `;
    }

    if (component.type === "checkbox") {
      html += `
        <div class="property-group">
          <label for="component-checked">Default Checked:</label>
          <select id="component-checked">
            <option value="false" ${
              !component.checked ? "selected" : ""
            }>No</option>
            <option value="true" ${
              component.checked ? "selected" : ""
            }>Yes</option>
          </select>
        </div>
      `;
    }

    if (component.type === "section") {
      html += `
        <div class="property-group">
          <label for="section-title">Section Title:</label>
          <input type="text" id="section-title" value="${
            component.title || ""
          }" placeholder="Enter section title">
        </div>
        <div class="property-group">
          <label for="section-description">Description:</label>
          <textarea id="section-description" placeholder="Enter section description">${
            component.description || ""
          }</textarea>
        </div>
      `;
    }

    propertiesContent.innerHTML = html;

    // Add event listeners for property changes
    this.setupPropertyListeners();
  }

  setupPropertyListeners() {
    const component = this.selectedComponent;
    if (!component) return;

    // Name change
    const nameInput = document.getElementById("component-name");
    if (nameInput) {
      nameInput.addEventListener("input", (e) => {
        component.name = e.target.value;
        // Update the visual label to show the name
        this.updateComponentLabel(component);
      });
    }

    // Label change
    const labelInput = document.getElementById("component-label");
    if (labelInput) {
      labelInput.addEventListener("input", (e) => {
        component.label = e.target.value;
        // Update the visual label on the component
        this.updateComponentLabel(component);
      });
    }

    // Type-specific listeners
    if (component.type === "text" || component.type === "textarea") {
      const placeholderInput = document.getElementById("component-placeholder");
      if (placeholderInput) {
        placeholderInput.addEventListener("input", (e) => {
          component.placeholder = e.target.value;
        });
      }

      const defaultValueInput = document.getElementById("component-default");
      if (defaultValueInput) {
        defaultValueInput.addEventListener("input", (e) => {
          component.defaultValue = e.target.value;
        });
      }
    }

    if (component.type === "picklist") {
      const optionsInput = document.getElementById("component-options");
      if (optionsInput) {
        optionsInput.addEventListener("input", (e) => {
          component.options = e.target.value
            .split("\n")
            .filter((option) => option.trim());
        });
      }

      const defaultValueInput = document.getElementById("component-default");
      if (defaultValueInput) {
        defaultValueInput.addEventListener("input", (e) => {
          component.defaultValue = e.target.value;
        });
      }
    }

    if (component.type === "checkbox") {
      const checkedInput = document.getElementById("component-checked");
      if (checkedInput) {
        checkedInput.addEventListener("change", (e) => {
          component.checked = e.target.value === "true";
        });
      }
    }

    if (component.type === "section") {
      const titleInput = document.getElementById("section-title");
      if (titleInput) {
        titleInput.addEventListener("input", (e) => {
          component.title = e.target.value;
        });
      }

      const descriptionInput = document.getElementById("section-description");
      if (descriptionInput) {
        descriptionInput.addEventListener("input", (e) => {
          component.description = e.target.value;
        });
      }
    }
  }

  hasOverlap(component, excludeId) {
    return this.components.some((other) => {
      if (other.id === excludeId) return false;

      // Skip overlap check for parent-child relationships
      if (
        component.parentSectionId === other.id ||
        other.parentSectionId === component.id
      ) {
        return false;
      }

      return !(
        component.x >= other.x + other.width ||
        component.x + component.width <= other.x ||
        component.y >= other.y + other.height ||
        component.y + component.height <= other.y
      );
    });
  }

  findNonOverlappingPosition(component) {
    const maxAttempts = 1000;
    let attempts = 0;

    while (attempts < maxAttempts) {
      if (!this.hasOverlap(component, component.id)) {
        return { x: component.x, y: component.y };
      }

      component.x += this.gridSize;
      if (component.x > 800) {
        component.x = 0;
        component.y += this.gridSize;
      }
      attempts++;
    }

    return { x: component.x, y: component.y };
  }

  resolveOverlaps() {
    for (let i = 0; i < this.components.length; i++) {
      const component = this.components[i];
      for (let j = i + 1; j < this.components.length; j++) {
        const other = this.components[j];

        // Skip overlap resolution for parent-child relationships
        if (
          component.parentSectionId === other.id ||
          other.parentSectionId === component.id
        ) {
          continue;
        }

        if (this.hasOverlap(component, other.id)) {
          const newPos = this.findNonOverlappingPosition(other);
          other.x = newPos.x;
          other.y = newPos.y;

          const element = document.querySelector(`[data-id="${other.id}"]`);
          if (element) {
            const absoluteX = other.parentSectionId
              ? this.components.find((c) => c.id === other.parentSectionId).x +
                other.x
              : other.x;
            const absoluteY = other.parentSectionId
              ? this.components.find((c) => c.id === other.parentSectionId).y +
                other.y
              : other.y;

            element.style.left = `${absoluteX}px`;
            element.style.top = `${absoluteY}px`;
          }
        }
      }
    }
  }

  saveLayout() {
    const layoutData = {
      components: this.components.map((c) => c.toJSON()),
      allowOverlap: this.allowOverlap,
      timestamp: new Date().toISOString(),
    };

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
      components: this.components.map((c) => c.toJSON()),
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
