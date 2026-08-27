class UIStore {
	isCreateModalOpen = $state(false);
	createInitialDate = $state<string | undefined>(undefined);

	openCreateTodo(initialDate?: string) {
		this.createInitialDate = initialDate;
		this.isCreateModalOpen = true;
	}

	closeCreateTodo() {
		this.isCreateModalOpen = false;
		this.createInitialDate = undefined;
	}
}

export const uiStore = new UIStore();
