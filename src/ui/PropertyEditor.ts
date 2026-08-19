import * as OBC from "@thatopen/components";
import * as BUI from "@thatopen/ui";
import * as THREE from "three";
import * as FRAGS from "@thatopen/fragments";

type TableData = {
  Name: string;
  Value?: string | number | boolean;
  LocalId: number;
  ParentLocalId?: number;
  ParentName?: string;
  Type?: "relation" | "related";
};

type TableNode = {
  data: TableData;
  children?: TableNode[];
};

type AttributeType = {
  name: string;
  type: string;
  value: string;
};

export class PropertyEditor {
  onItemCreated = new OBC.Event<void>();
  onPropertiesUpdated = new OBC.Event<TableNode[]>();
  onCategoriesUpdated = new OBC.Event<void>();

  elementConfig: FRAGS.ElementConfig = {
    data: {
      attributesDefault: true,
      relations: {
        IsDefinedBy: { attributes: true, relations: true },
        DefinesOccurrence: { attributes: false, relations: false },
      },
    },
  };

  currentElement: FRAGS.Element | null = null;
  currentMesh: THREE.Group | null = null;
  currentModel: FRAGS.FragmentsModel | null = null;
  currentLocalId: number | null = null;

  itemsDataById = new Map<number, FRAGS.ItemData>();
  updatedItems = new Set<number>();
  currentRelation: { id: number; name: string; ids: number[] } | null = null;
  currentCategory: string | null = null;
  currentAttributes: AttributeType[] = [];

  allCategories: string[] = [];

  private _world: OBC.World;
  public _fragments: OBC.FragmentsManager;

  constructor(world: OBC.World, fragments: OBC.FragmentsManager) {
    this._world = world;
    this._fragments = fragments;
    this.setupEvents();
  }

  async init() {
    await this.updateCategories();
  }

  async updateCategories() {
    const cats = new Set<string>();
    for (const [, model] of this._fragments.list) {
      if (typeof model.getCategories === 'function') {
        const c = await model.getCategories();
        c.forEach((cat: string) => cats.add(cat));
      }
    }
    this.allCategories = Array.from(cats);
  }

  addEmptyAttribute() {
    this.currentAttributes.push({ name: "", type: "string", value: "" });
  }

  deleteAttribute(attribute: AttributeType) {
    const index = this.currentAttributes.indexOf(attribute);
    if (index !== -1) {
      this.currentAttributes.splice(index, 1);
    }
  }

  updateAttribute(row: Partial<TableData>, e: any) {
    const localId = row.LocalId as number;
    const item = this.itemsDataById.get(localId);
    if (!item) {
      return;
    }
    const attr = item[row.Name!] as FRAGS.ItemAttribute;
    if (attr && typeof attr === "object") {
      if (e.target.type === 'checkbox') {
        attr.value = e.target.checked;
      } else {
        attr.value = e.target.value;
      }
    } else {
      (item as any)[row.Name!] = e.target.type === 'checkbox' ? e.target.checked : e.target.value;
    }
    this.updatedItems.add(localId);
  }

  updatePropertiesTable = async () => {
    this.itemsDataById.clear();
    this.updatedItems.clear();

    let data: any = null;
    if (this.currentElement) {
      try {
        data = await this.currentElement.getData();
      } catch (e) {
        console.warn("currentElement getData error:", e);
      }
    }

    if (!data && this.currentModel && this.currentLocalId !== null) {
      if (typeof this.currentModel.getItemsData === "function") {
        try {
          const [itemData] = await this.currentModel.getItemsData([this.currentLocalId], {
            attributesDefault: true,
            relations: {
              IsDefinedBy: { attributes: true, relations: true },
              DefinesOccurrence: { attributes: true, relations: true },
            },
          });
          data = itemData;
        } catch (e) {
          console.warn("currentModel getItemsData error:", e);
        }
      }

      if (!data) {
        const props = (this.currentModel as any).properties || (this.currentModel as any).getLocalProperties?.() || {};
        data = props[this.currentLocalId] || null;
      }
    }

    if (!data) {
      this.onPropertiesUpdated.trigger([]);
      return;
    }

    // Use a visited set to prevent infinite recursion from circular IFC relations
    const visited = new Set<number>();
    const rootNode = this.getTableRecursively(data, undefined, visited);
    this.onPropertiesUpdated.trigger([rootNode]);
  };

  async applyChanges() {
    if (!this.currentModel) {
      return;
    }

    const editor = this._fragments?.core?.editor;
    if (editor && typeof editor.setItem === "function") {
      for (const localId of this.updatedItems) {
        const item = this.itemsDataById.get(localId);
        if (item) {
          editor.setItem(this.currentModel.modelId, item);
        }
      }
      await editor.applyChanges(this.currentModel.modelId);
    }

    if (this.currentElement && this.currentMesh) {
      this.currentElement.disposeMeshes(this.currentMesh);
    }

    this.onPropertiesUpdated.trigger([]);
    this.itemsDataById.clear();

    if ('update' in this._fragments.core) {
      await (this._fragments.core as any).update(true);
    }

    this.currentElement = null;
    this.currentModel = null;
    this.currentLocalId = null;
    this.updatePropertiesTable();
  }

  async relate() {
    if (!this.currentRelation || !this.currentModel) {
      return;
    }
    const { id, name, ids } = this.currentRelation;
    const editor = this._fragments.core.editor;
    await editor.relate(this.currentModel.modelId, id, name, ids);
    await editor.applyChanges(this.currentModel.modelId);
    await this.updatePropertiesTable();
  }

  async unrelate() {
    if (!this.currentRelation || !this.currentModel) {
      return;
    }
    const { id, name, ids } = this.currentRelation;
    const editor = this._fragments.core.editor;
    await editor.unrelate(this.currentModel.modelId, id, name, ids);
    await editor.applyChanges(this.currentModel.modelId);
    await this.updatePropertiesTable();
  }

  async createItem() {
    if (!this.currentCategory || !this.currentModel) return;

    const data: Record<string, FRAGS.ItemAttribute> = {};
    const guid = THREE.MathUtils.generateUUID();

    for (const attribute of this.currentAttributes) {
      if (attribute.name && attribute.value) {
        data[attribute.name] = {
          type: attribute.type,
          value: attribute.value,
        };
      }
    }

    const editor = this._fragments.core.editor;
    editor.createItem(this.currentModel.modelId, {
      data,
      category: this.currentCategory,
      guid,
    });

    await editor.applyChanges(this.currentModel.modelId);

    await this.updateCategories();
    this.onCategoriesUpdated.trigger();

    this.onItemCreated.trigger();
  }

  async deleteItem(localId: number) {
    if (!this.currentElement || !this.currentModel) {
      return;
    }
    const editor = this._fragments.core.editor;
    await editor.deleteData(this.currentModel.modelId, {
      itemIds: [localId],
    });
    await editor.applyChanges(this.currentModel.modelId);
    await this.updatePropertiesTable();
  }

  /**
   * Recursively converts FRAGS.ItemData to a TableNode tree.
   * Uses a `visited` Set to detect and break circular references (common in IFC graphs).
   */
  private getTableRecursively(
    data: FRAGS.ItemData,
    parent?: TableNode,
    visited: Set<number> = new Set()
  ): TableNode {
    if (!data) {
      return {
        data: {
          Name: "Empty Node",
          LocalId: 0,
          Type: "related",
        },
        children: [],
      };
    }

    const localId = (data._localId && typeof data._localId === "object" && "value" in data._localId)
      ? (data._localId.value as number)
      : (((data as any).localId as number) || ((data as any).expressId as number) || 0);

    // Break cycles: if we've already processed this localId in this traversal, return a stub
    if (visited.has(localId)) {
      const stubNode: TableNode = {
        data: {
          Name: `[Circular ref: ${localId}]`,
          LocalId: localId,
          Type: "related",
        },
        children: [],
      };
      if (parent) {
        parent.children!.push(stubNode);
        stubNode.data.ParentLocalId = parent.data.LocalId;
        stubNode.data.ParentName = parent.data.Name;
      }
      return stubNode;
    }

    visited.add(localId);
    this.itemsDataById.set(localId, data);

    const currentNode: TableNode = {
      data: {
        Name: localId ? localId.toString() : "Element",
        LocalId: localId,
        Type: "related",
      },
      children: [],
    };

    if (parent) {
      parent.children!.push(currentNode);
      currentNode.data.ParentLocalId = parent.data.LocalId;
      currentNode.data.ParentName = parent.data.Name;
    }

    for (const name in data) {
      const current = data[name];
      if (Array.isArray(current)) {
        // Is a relation array
        const relNode: TableNode = {
          data: {
            Name: name,
            LocalId: localId,
            Type: "relation",
          },
          children: [],
        };

        currentNode.children!.push(relNode);
        for (const item of current) {
          if (item) {
            this.getTableRecursively(item, relNode, visited);
          }
        }
      } else if (current && typeof current === "object" && "value" in current) {
        // Is an ItemAttribute
        if (current.value === undefined || current.value === null) {
          continue;
        }
        if (name.startsWith("_") && name !== "_category") {
          continue;
        }
        currentNode.children!.push({
          data: {
            Name: name === "_category" ? "IFC Category" : name,
            Value: current.value as string | number | boolean,
            LocalId: localId,
          },
        });
      } else if (current !== undefined && current !== null && !name.startsWith("_")) {
        // Plain string/number/boolean fallback
        const objVal = current as any;
        currentNode.children!.push({
          data: {
            Name: name,
            Value: typeof current === "object" ? (objVal.value !== undefined ? objVal.value : JSON.stringify(current)) : (current as any),
            LocalId: localId,
          },
        });
      }
    }

    // Remove localId from visited so sibling branches can visit the same node
    visited.delete(localId);

    return currentNode;
  }

  public async selectElement(matchedModel: FRAGS.FragmentsModel, localId: number) {
    if (this.currentElement && this.currentMesh) {
      try {
        this.currentElement.disposeMeshes(this.currentMesh);
        this._world.scene.three.remove(this.currentMesh);
      } catch (e) {
        // ignore cleanup error
      }
      this.currentMesh = null;
    }

    this.currentModel = matchedModel;
    this.currentLocalId = localId;

    try {
      let element: any = null;
      if (this._fragments?.core?.editor && typeof this._fragments.core.editor.getElements === "function") {
        try {
          const elements = await this._fragments.core.editor.getElements(matchedModel.modelId, [
            localId,
          ]);
          element = elements?.[0] || null;
        } catch (e) {
          console.warn("editor.getElements fallback:", e);
        }
      }

      this.currentElement = element;
      if (element) {
        element.config = this.elementConfig;
        if (typeof element.getMeshes === "function") {
          try {
            this.currentMesh = await element.getMeshes();
            if (this.currentMesh) {
              this.currentMesh.traverse((child: any) => {
                if (child instanceof THREE.Mesh) {
                  const mat = child.material as THREE.MeshLambertMaterial;
                  if (mat) {
                    mat.depthTest = false;
                    mat.color?.set?.("#D4FF3F");
                  }
                }
              });
              this._world.scene.three.add(this.currentMesh);
            }
          } catch (e) {
            console.warn("element getMeshes error:", e);
          }
        }
      }

      await this.updatePropertiesTable();
    } catch (err) {
      console.warn("PropertyEditor selectElement fallback:", err);
      await this.updatePropertiesTable();
    }
  }

  public async deselect() {
    if (this.currentElement && this.currentMesh) {
      try {
        this.currentElement.disposeMeshes(this.currentMesh);
        this._world.scene.three.remove(this.currentMesh);
      } catch (e) {
        // ignore
      }
      this.currentMesh = null;
    }

    if (this.currentElement && typeof this.currentElement.getRequests === "function") {
      try {
        this.currentElement.getRequests();
      } catch (e) {}
    }

    this.currentAttributes = [];
    this.itemsDataById.clear();
    this.updatedItems.clear();
    this.onPropertiesUpdated.trigger([]);

    if ('update' in this._fragments.core) {
      try {
        await (this._fragments.core as any).update(true);
      } catch (e) {}
    }

    this.currentElement = null;
    this.currentModel = null;
    this.currentLocalId = null;
  }

  private setupEvents() {
    window.addEventListener("keydown", async (event) => {
      if (event.key === "Escape") {
        await this.deselect();
      }
    });
  }
}

export function initPropertyEditorUI(editor: PropertyEditor, container: HTMLElement) {
  const propertiesTable = document.createElement("bim-table") as BUI.Table<TableData>;
  propertiesTable.headersHidden = true;
  propertiesTable.expanded = true;
  propertiesTable.hiddenColumns = [
    "LocalId",
    "Type",
    "ParentLocalId",
    "ParentName",
  ];

  // --- Search bar for properties table (simple stateless DOM element) ---
  const searchSection = BUI.Component.create<HTMLDivElement>(() => {
    return BUI.html`
      <div style="padding: 0.25rem 0.5rem 0.5rem; display: flex; gap: 0.4rem; align-items: center;">
        <bim-text-input
          id="props-search-input"
          placeholder="Search properties..."
          style="flex: 1;"
          @input=${(e: any) => {
            propertiesTable.queryString = e.target.value;
          }}
        ></bim-text-input>
        <bim-button
          icon="material-symbols:clear"
          style="transform: scale(0.8);"
          @click=${() => {
            const input = document.getElementById("props-search-input") as any;
            if (input) { input.value = ""; }
            propertiesTable.queryString = null;
          }}
        ></bim-button>
      </div>
    `;
  });

  const onCloseAddItemModal = new OBC.Event<void>();

  const [addItemModal, updateAddItemModal] = BUI.Component.create<HTMLDialogElement, any>((_) => {
    const itemIdsDropdownContainer = BUI.Component.create<HTMLDivElement>(() => {
      return BUI.html`<div></div>`;
    });

    const updateItemIds = async (category: string | undefined) => {
      const children = Array.from(itemIdsDropdownContainer.children);
      for (const child of children) {
        child.remove();
      }

      const itemIdsDropdown = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
        <bim-dropdown label="Select items" multiple @change=${(e: any) => {
          if (!editor.currentRelation) return;
          editor.currentRelation.ids = e.target.value as number[];
        }}>
        </bim-dropdown>
        `;
      });

      itemIdsDropdownContainer.appendChild(itemIdsDropdown);

      if (!category || !editor.currentModel) {
        return;
      }

      const regexp = new RegExp(category);
      let itemIdsByCategory: any = {};
      if (editor.currentModel.getItemsOfCategories) {
          itemIdsByCategory = await editor.currentModel.getItemsOfCategories([regexp]);
      }

      for (const categoryName in itemIdsByCategory) {
        const itemIds = itemIdsByCategory[categoryName];
        for (const itemId of itemIds) {
          const itemIdOption = BUI.Component.create<BUI.Option>(() => {
            return BUI.html`
            <bim-option value=${itemId} label=${itemId}></bim-option>
            `;
          });
          itemIdsDropdown.appendChild(itemIdOption);
        }
      }
    };

    const categoriesDropdown = BUI.Component.create<BUI.Dropdown>(() => {
      return BUI.html`
          <bim-dropdown label="Select category" @change=${(e: any) => {
            if (e.target.value[0]) {
              updateItemIds(e.target.value[0]);
            }
          }}>
          ${editor.allCategories.map((category) => {
            return BUI.html`
            <bim-option value=${category} label=${category}>
            </bim-option>`;
          })}
          </bim-dropdown>
      `;
    });

    onCloseAddItemModal.reset();
    onCloseAddItemModal.add(() => {
      categoriesDropdown.value = [];
      updateAddItemModal();
    });

    return BUI.html`
      <dialog class="blurred-dialog">
       <bim-panel style="border-radius: var(--bim-ui_size-base); width: 22rem;">
        <bim-panel-section fixed label="Add item to relation">
          ${categoriesDropdown}
          ${itemIdsDropdownContainer}
          <bim-button label="Apply" @click=${() => {
            if (editor.currentElement && editor.currentRelation) {
              editor.relate().then(() => {
                addItemModal.close();
              });
            }
          }}></bim-button>
        </bim-panel-section>
       </bim-panel> 
      </dialog>
    `;
  }, {});

  document.body.appendChild(addItemModal);
  addItemModal.addEventListener("close", () => onCloseAddItemModal.trigger());
  editor.onCategoriesUpdated.add(() => updateAddItemModal());

  const onCloseCreateItemModal = new OBC.Event<void>();

  const [createItemModal, updateCreateItemModal] = BUI.Component.create<HTMLDialogElement, any>((_) => {
    const formContainer = BUI.Component.create<HTMLDivElement>(() => {
      return BUI.html`
      <div style="display: flex; flex-direction: column; gap: 0.5rem;"></div>
      `;
    });

    if (editor.currentAttributes.length === 0) {
      editor.addEmptyAttribute();
    }

    for (const attribute of editor.currentAttributes) {
      const entry = BUI.Component.create<HTMLDivElement>(() => {
        return BUI.html`
        <div style="display: flex; align-items: center; gap: 0.5rem;">
          <bim-text-input placeholder="Name" value=${attribute.name} @input=${(e: any) => { attribute.name = e.target.value; }}></bim-text-input>
          <bim-text-input placeholder="Type" value=${attribute.type} @input=${(e: any) => { attribute.type = e.target.value; }}></bim-text-input>
          <bim-text-input placeholder="Value" value=${attribute.value} @input=${(e: any) => { attribute.value = e.target.value; }}></bim-text-input>
          <bim-button icon="material-symbols:delete" @click=${() => {
            editor.deleteAttribute(attribute);
            updateCreateItemModal();
          }}></bim-button>
        </div>
        `;
      });
      formContainer.appendChild(entry);
    }

    onCloseCreateItemModal.reset();
    onCloseCreateItemModal.add(() => {
      editor.currentAttributes = [];
      updateCreateItemModal();
    });

    return BUI.html`
      <dialog class="blurred-dialog">
       <bim-panel style="border-radius: var(--bim-ui_size-base); width: 22rem;">
        <bim-panel-section fixed label="Create new element">
        <bim-text-input label="Category" @input=${(e: any) => {
          editor.currentCategory = e.target.value as string;
        }}></bim-text-input>
          ${formContainer}
          <bim-button label="Add attribute" icon="ic:baseline-add" @click=${() => {
            editor.addEmptyAttribute();
            updateCreateItemModal();
          }}></bim-button>
          <bim-button label="Apply" @click=${() => {
            editor.createItem();
          }}></bim-button>
        </bim-panel-section>
       </bim-panel> 
      </dialog>
    `;
  }, {});

  document.body.appendChild(createItemModal);
  editor.onItemCreated.add(() => createItemModal.close());
  createItemModal.addEventListener("close", () => onCloseCreateItemModal.trigger());
  editor.onCategoriesUpdated.add(() => updateCreateItemModal());

  const onCloseAddRelationModal = new OBC.Event<void>();

  const [addRelationModal, updateAddRelationModal] = BUI.Component.create<HTMLDialogElement, any>((_) => {
    const itemIdsDropdownContainer = BUI.Component.create<HTMLDivElement>(() => {
      return BUI.html`<div></div>`;
    });

    const relationNameInput = BUI.Component.create<BUI.PanelSection>(() => {
      return BUI.html`
      <bim-text-input label="Relation name" @input=${(e: any) => {
        if (!editor.currentRelation) return;
        editor.currentRelation.name = e.target.value as string;
      }}>
      </bim-text-input>
      `;
    });

    const updateItemIds = async (category: string | undefined) => {
      const children = Array.from(itemIdsDropdownContainer.children);
      for (const child of children) {
        child.remove();
      }

      const itemIdsDropdown = BUI.Component.create<BUI.PanelSection>(() => {
        return BUI.html`
        <bim-dropdown label="Select items" multiple @change=${(e: any) => {
          if (!editor.currentRelation) return;
          editor.currentRelation.ids = e.target.value as number[];
        }}>
        </bim-dropdown>
        `;
      });

      itemIdsDropdownContainer.appendChild(itemIdsDropdown);

      if (!category || !editor.currentModel) return;

      const regexp = new RegExp(category);
      let itemIdsByCategory: any = {};
      if (editor.currentModel.getItemsOfCategories) {
          itemIdsByCategory = await editor.currentModel.getItemsOfCategories([regexp]);
      }

      for (const categoryName in itemIdsByCategory) {
        const itemIds = itemIdsByCategory[categoryName];
        for (const itemId of itemIds) {
          const itemIdOption = BUI.Component.create<BUI.Option>(() => {
            return BUI.html`
            <bim-option value=${itemId} label=${itemId}></bim-option>
            `;
          });
          itemIdsDropdown.appendChild(itemIdOption);
        }
      }
    };

    const categoriesDropdown = BUI.Component.create<BUI.Dropdown>(() => {
      return BUI.html`
          <bim-dropdown label="Select category" @change=${(e: any) => {
            if (e.target.value[0]) {
              updateItemIds(e.target.value[0]);
            }
          }}>
          ${editor.allCategories.map((category) => {
            return BUI.html`<bim-option value=${category} label=${category}></bim-option>`;
          })}
          </bim-dropdown>
      `;
    });

    onCloseAddItemModal.reset();
    onCloseAddRelationModal.add(() => {
      categoriesDropdown.value = [];
      updateAddRelationModal();
    });

    return BUI.html`
      <dialog class="blurred-dialog">
       <bim-panel style="border-radius: var(--bim-ui_size-base); width: 22rem;">
        <bim-panel-section fixed label="Add new relation">
          ${relationNameInput}
          ${categoriesDropdown}
          ${itemIdsDropdownContainer}
          <bim-button label="Create relation" @click=${() => {
            if (editor.currentElement && editor.currentRelation) {
              editor.elementConfig.data.relations[editor.currentRelation.name] = {
                attributes: true,
                relations: true,
              };
              editor.relate().then(() => {
                addRelationModal.close();
              });
            }
          }}></bim-button>
        </bim-panel-section>
       </bim-panel> 
      </dialog>
    `;
  }, {});

  document.body.appendChild(addRelationModal);
  addRelationModal.addEventListener("close", () => onCloseAddRelationModal.trigger());

  propertiesTable.dataTransform = {
    Name: (value: any, row: Partial<TableData>) => {
      if (!row.Name || row.Name[0] === "_") {
        return value;
      }

      if (row.Type === "relation") {
        return BUI.html`
          <div style="display: flex; align-items: center; gap: 0.5rem;">
            <bim-label>${value}</bim-label>
            <bim-button icon="ic:baseline-plus" style="border: 1px solid var(--bim-ui_main-base); transform: scale(0.8);" @click=${() => {
              editor.currentRelation = {
                id: row.LocalId as number,
                name: value,
                ids: [],
              };
              addItemModal.showModal();
            }}></bim-button>
          </div>
        `;
      }

      if (row.Type === "related") {
        return BUI.html`
          <div style="display: flex; align-items: center;">
            <bim-label>${value}</bim-label>
            ${
              row.ParentLocalId !== undefined
                ? BUI.html`<bim-button icon="ic:baseline-close" style="transform: scale(0.8);" @click=${() => {
                    if (editor.currentElement) {
                      editor.currentRelation = {
                        id: row.ParentLocalId as number,
                        name: row.ParentName as string,
                        ids: [row.LocalId as number],
                      };
                      editor.unrelate();
                    }
                  }}></bim-button>

                  <bim-button icon="material-symbols:delete" style="transform: scale(0.8);" @click=${() => {
                    if (editor.currentElement) {
                      editor.deleteItem(row.LocalId as number);
                    }
                  }}></bim-button>
                `
                : ""
            }

            <bim-button icon="flowbite:paper-clip-outline" style="transform: scale(0.8);" @click=${() => {
              if (editor.currentElement) {
                editor.currentRelation = {
                  id: row.LocalId as number,
                  name: value,
                  ids: [],
                };
                addRelationModal.showModal();
              }
            }}></bim-button>
            
          </div>
        `;
      }

      return value;
    },
    Value: (value: any, row: Partial<TableData>) => {
      if (!row.Name || row.Name[0] === "_") {
        return value;
      }

      if (typeof value === "string") {
        return BUI.html`<bim-text-input value=${value} @input=${(e: any) => {
          editor.updateAttribute(row, e);
        }}></bim-text-input>`;
      }

      if (typeof value === "number") {
        return BUI.html`<bim-number-input value=${value} @change=${(e: any) => {
          editor.updateAttribute(row, e);
        }}></bim-number-input>`;
      }

      return BUI.html`<bim-checkbox ?checked=${value} @change=${(e: any) => {
        editor.updateAttribute(row, e);
      }}></bim-checkbox>`;
    },
  };

  const updateTableButton = BUI.Component.create<BUI.Button>(() => {
    return BUI.html`
      <bim-button label="Apply changes" @click=${() => {
        editor.applyChanges();
      }}></bim-button>
    `;
  });

  editor.onPropertiesUpdated.add((data) => {
    propertiesTable.data = data;
    const tableVisible = propertiesTable.data.length > 0;
    updateTableButton.style.display = tableVisible ? "block" : "none";
    // Ensure search stays active across updates
    const input = document.getElementById("props-search-input") as any;
    if (input && input.value) {
      propertiesTable.queryString = input.value;
    }
  });

  const exportModel = async () => {
    if(!editor.currentModel) return;
    await editor._fragments.core.editor.save(editor.currentModel.modelId);
    window.setTimeout(async () => {
      const exportedBuffer = await editor.currentModel!.getBuffer();
      const exportedBytes = new Uint8Array(exportedBuffer);
      const exportedBlob = new Blob([exportedBytes]);
      const exportedUrl = URL.createObjectURL(exportedBlob);
      const exportedLink = document.createElement("a");
      exportedLink.href = exportedUrl;
      exportedLink.download = "exported.frag";
      document.body.appendChild(exportedLink);
      exportedLink.click();
      document.body.removeChild(exportedLink);
      URL.revokeObjectURL(exportedUrl);
    }, 1000);
  };

  const [panel] = BUI.Component.create<BUI.PanelSection, any>((_) => {
    return BUI.html`
      <bim-panel-section label="Editor Controls">
        <bim-button label="Save (Export)" @click=${exportModel}></bim-button>
        <bim-button label="Create new item" @click=${() => {
          createItemModal.showModal();
        }}></bim-button>
        ${updateTableButton}
      </bim-panel-section>
      <bim-panel-section label="Properties">
        ${searchSection}
        ${propertiesTable}
      </bim-panel-section>
    `;
  }, {});

  container.appendChild(panel);
}
