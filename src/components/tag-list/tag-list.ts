import { TagService } from "./../../services/tagService";
import * as ko from "knockout";
import * as Constants from "../../constants";
import template from "./tag-list.html";
import { Component, OnMounted, Event, Param } from "@paperbits/common/ko/decorators";
import { Tag } from "../../models/tag";

@Component({
    selector: "tag-list",
    template: template
})
export class TagList {
    public readonly tags: ko.ObservableArray<Tag>;
    public readonly pattern: ko.Observable<string>;
    public readonly empty: ko.Computed<boolean>;

    constructor(private readonly tagService: TagService) {
        this.tags = ko.observableArray();
        this.pattern = ko.observable();
        this.empty = ko.computed(() => this.tags().length === 0);
        this.selection = ko.observableArray([]);
    }

    @Param()
    public scope: string;

    @Param()
    public selection: ko.ObservableArray<Tag>;

    @Event()
    public onSelect: (tag: Tag) => void;

    @OnMounted()
    public async initialize(): Promise<void> {
        if (!this.scope) {
            return;
        }

        await this.resetSearch();

        this.pattern
            .extend({ rateLimit: { timeout: Constants.defaultInputDelayMs, method: "notifyWhenChangesStop" } })
            .subscribe(this.resetSearch);
    }

    public async loadPageOfTags(): Promise<void> {
        const pageOfTags = await this.tagService.getTags(this.scope, this.pattern());
        const tags = pageOfTags.value.filter(tag => !this.selection().map(x => x.id).includes(tag.id));

        this.tags(tags);
    }

    public async resetSearch(): Promise<void> {
        await this.loadPageOfTags();
    }

    public selectTag(tag: Tag): void {
        const index = this.tags().indexOf(tag);
        this.tags.splice(index, 1);
        this.onSelect(tag);
    }
}